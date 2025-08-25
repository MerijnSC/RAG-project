from transformers import AutoTokenizer, AutoModel
import torch
import time
import numpy as np
import spacy
from tqdm import tqdm
import logging
import bisect



logger = logging.getLogger(__name__)


def embed(content: str, context_length: int, stride: int, batch_size: int, model_name: str = "Qwen/Qwen3-0.6B"):


    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name)

    max_length = tokenizer.model_max_length
    if context_length > max_length:
        raise ValueError(f"Context length ({context_length}) exceeds the model's maximum token length ({max_length}).")



    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()



    tokens = tokenizer(content, return_tensors="pt", truncation=False, return_offsets_mapping=True)
    spans = tokens["offset_mapping"][0] 


    input_ids = tokens['input_ids'][0]
    attention_mask = tokens['attention_mask'][0]

    total_tokens = input_ids.size(0)

    logger.info(f"Total tokens: {total_tokens}")

    if total_tokens <= context_length:
        windows = 0
        batches = [(input_ids, attention_mask)]
        reshaped_weights = 1

    else:
        windows = total_tokens // stride -1
        batches = []
        for i in range(windows):
            start = i * stride
            end = start + context_length
            batches.append((
                input_ids[start:end].unsqueeze(0),
                attention_mask[start:end].unsqueeze(0) 
            ))
        
        batches.append((
                input_ids[-context_length:].unsqueeze(0),
                attention_mask[-context_length:].unsqueeze(0) 
            ))


        min_weight = 0.01
        inc = min_weight/(1-min_weight)
        weights = np.arange(context_length).astype(float)
        weights = np.abs(weights-np.mean(weights))
        weights = (1+inc - (weights - weights.min()) / (weights.max() - weights.min())) / (1+inc)
        reshaped_weights = torch.from_numpy(weights).float().view(1, context_length, 1)

        
    all_ids = torch.vstack([ids for ids, mask in batches])
    all_masks = torch.vstack([mask for ids, mask in batches])
    torch.cuda.empty_cache()

    
    emb_chunks = []
    with torch.inference_mode():         
        for i in tqdm(range(0, all_ids.size(0), batch_size), total=(all_ids.size(0) + batch_size - 1) // batch_size, desc="Embedding batches"):
            ids = all_ids[i:i+batch_size].to(device)
            masks = all_masks[i:i+batch_size].to(device)

            out = model(input_ids=ids, attention_mask=masks)
            emb = out.last_hidden_state   

            emb_chunks.append(emb.detach().cpu())   # move to CPU immediately
            torch.cuda.empty_cache()

    embeddings = torch.cat(emb_chunks, dim=0) 


    # unit_embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=-1)
    unit_embeddings = embeddings



    # weighted_embeddings = unit_embeddings * reshaped_weights
    weighted_embeddings = unit_embeddings

    pooled_embeddings = torch.zeros(
        (total_tokens, weighted_embeddings.shape[-1]),
        dtype=weighted_embeddings.dtype      
    )

    for i in range(windows):
        start = i * stride
        end = start + context_length
        pooled_embeddings[start:end].add_(weighted_embeddings[i])
    pooled_embeddings[-context_length:].add_(weighted_embeddings[-1])

    # pooled_embeddings = torch.nn.functional.normalize(pooled_embeddings, p=2, dim=-1)


    torch.cuda.empty_cache()
    return pooled_embeddings, spans



nlp = spacy.load("en_core_web_sm", disable=["parser", "ner"])
if "sentencizer" not in nlp.pipe_names:
    nlp.add_pipe("sentencizer")

def sentence_chunk(content: str, token_embeddings, token_spans):
    nlp.max_length = len(content) + 1000

    doc = nlp(content)
    sentence_spans = [(sent.start_char, sent.end_char) for sent in doc.sents]
    token_spans = np.array(token_spans)

    sentence_embeddings = []
    for sent_start, sent_end in sentence_spans:
        indices = np.where((token_spans[:, 0] >= sent_start) & (token_spans[:, 1] <= sent_end))[0]
        sentence_embeddings.append(token_embeddings[indices].mean(dim=0))
        # sentence_embeddings.append(token_embeddings[indices].max(dim=0).values)


    sentence_embeddings = torch.stack(sentence_embeddings)
    sentence_embeddings = torch.nn.functional.normalize(sentence_embeddings, p=2, dim=-1)

    nlp.max_length = 1_000_000
    return sentence_embeddings[:100], np.array(sentence_spans)[:100]




class RangeDict:
    def __init__(self, ranges=None):
        """
        ranges: list of tuples (start, end, value)
        Must be sorted by start. If None, start empty.
        """
        self.starts = []
        self.ends = []
        self.values = []

        if ranges:
            for start, end, value in sorted(ranges, key=lambda x: x[0]):
                self.add_range(start, end, value)

    def add_range(self, start, end, value):
        """Add a new range to the dictionary. Keeps ranges sorted by start."""
        if start > end:
            raise ValueError("Start of range cannot be greater than end.")
        
        # Insert in sorted order
        i = bisect.bisect_right(self.starts, start)
        self.starts.insert(i, start)
        self.ends.insert(i, end)
        self.values.insert(i, value)

    def get(self, key):
        i = bisect.bisect_right(self.starts, key) - 1
        if i >= 0 and self.starts[i] <= key <= self.ends[i]:
            return self.values[i]
        raise KeyError(f"No range found for key {key}")

    def __getitem__(self, key):
        return self.get(key)

    def __repr__(self):
        return f"RangeDict({list(zip(self.starts, self.ends, self.values))})"
