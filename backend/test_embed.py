import torch
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer
import spacy

_MODEL_CACHE = {}
nlp = spacy.load("en_core_web_sm", disable=["parser", "ner"])
if "sentencizer" not in nlp.pipe_names:
    nlp.add_pipe("sentencizer")


def _get_st_model_and_tokenizer(model_name: str, device: torch.device = None):
    """
    Load and cache SentenceTransformer model + HF tokenizer. Moves model to `device`.
    Returns: model, tokenizer, device
    """
    if model_name in _MODEL_CACHE:
        model, tokenizer, model_device = _MODEL_CACHE[model_name]
        if device is not None and model_device != device:
            # SentenceTransformer doesn't have .to, use model._first_module().to if needed,
            # but encode() accepts device argument so we only update cached device.
            model_device = device
        _MODEL_CACHE[model_name] = (model, tokenizer, model_device)
        return model, tokenizer, model_device

    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # SentenceTransformer handles its own HF model internally, but we still load a tokenizer
    # from HF for consistent token counting.
    tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=True)
    model = SentenceTransformer(model_name, device=str(device))
    _MODEL_CACHE[model_name] = (model, tokenizer, device)
    return model, tokenizer, device


def sentence_chunk(
    content: str,
    # model_name: str = "Qwen/Qwen3-0.6B",
    model_name: str = "intfloat/multilingual-e5-large-instruct",
    max_tokens_per_batch: int = 1024,
    normalize_embeddings: bool = True,
    device: torch.device = None,
):
    """
    Split `content` into spaCy sentences, compute embeddings using sentence-transformers
    in token-count-limited batches.

    Returns:
      embeddings: torch.Tensor (n_sentences, dim), dtype=torch.float32, on model device
      spans: np.ndarray shape (n_sentences, 2) with (start_char, end_char)
    """
    # allow spaCy to handle long texts
    nlp.max_length = max(nlp.max_length, len(content) + 1000)

    doc = nlp(content)
    sentences = [sent for sent in doc.sents]
    spans = [(int(sent.start_char), int(sent.end_char)) for sent in sentences]

    if len(sentences) == 0:
        return torch.empty((0, 0), dtype=torch.float32), np.array([])

    texts = [sent.text.strip() or sent.text for sent in sentences]

    # get model + tokenizer
    preferred_device = torch.device("cuda" if torch.cuda.is_available() else "cpu") if device is None else device
    model, tokenizer, model_device = _get_st_model_and_tokenizer(model_name, device=preferred_device)

    # compute token lengths per sentence (includes special tokens when using tokenizer.encode)
    token_lengths = []
    for t in texts:
        ids = tokenizer.encode(t, truncation=True, max_length=tokenizer.model_max_length)
        token_lengths.append(len(ids) if len(ids) > 0 else 1)

    # Build batches greedily by token count
    batches = []
    cur_batch = []
    cur_tokens = 0
    for idx, tlen in enumerate(token_lengths):
        if cur_tokens + tlen > max_tokens_per_batch and len(cur_batch) > 0:
            batches.append(cur_batch)
            cur_batch = [idx]
            cur_tokens = tlen
        else:
            cur_batch.append(idx)
            cur_tokens += tlen
    if len(cur_batch) > 0:
        batches.append(cur_batch)

    all_embeddings = []
    # Encode each batch with sentence-transformers encode (it handles pooling internally)
    for batch_idxs in batches:
        batch_texts = [texts[i] for i in batch_idxs]
        try:
            batch_emb = model.encode(
                batch_texts,
                convert_to_numpy=True,
                show_progress_bar=False,
                device=str(model_device),
                batch_size=len(batch_texts),
            )
            all_embeddings.append(batch_emb.astype(np.float32))
        except RuntimeError as e:
            # If CUDA OOM, fall back to CPU for this batch
            if "out of memory" in str(e).lower() and str(model_device).startswith("cuda"):
                torch.cuda.empty_cache()
                batch_emb = model.encode(
                    batch_texts,
                    convert_to_numpy=True,
                    show_progress_bar=False,
                    device="cpu",
                    batch_size=len(batch_texts),
                )
                all_embeddings.append(batch_emb.astype(np.float32))
            else:
                raise

    if len(all_embeddings) == 0:
        return torch.empty((0, 0), dtype=torch.float32), np.array(spans)

    embeddings = np.vstack(all_embeddings)  # shape (n_sentences, dim)

    # final sanity: ensure number of embeddings equals number of sentences
    if embeddings.shape[0] != len(sentences):
        n_needed = len(sentences)
        if embeddings.shape[0] < n_needed:
            pad = np.zeros((n_needed - embeddings.shape[0], embeddings.shape[1]), dtype=np.float32)
            embeddings = np.vstack([embeddings, pad])
        else:
            embeddings = embeddings[:n_needed]

    # optional normalization (L2) in numpy
    if normalize_embeddings:
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        norms = np.maximum(norms, 1e-12)
        embeddings = embeddings / norms

    # convert to torch tensor and move to model device
    embeddings_t = torch.from_numpy(embeddings.astype(np.float32))


    return embeddings_t, np.array(spans)
