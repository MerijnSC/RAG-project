from transformers import AutoTokenizer, AutoModel
import numpy as np
import torch
from tqdm import tqdm




def embed(text: str, context_length: int, stride: int, batch_size: int, model_name: str = "Qwen/Qwen3-0.6B"):


    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name)

    max_length = tokenizer.model_max_length
    if context_length > max_length:
        raise ValueError(f"Context length ({context_length}) exceeds the model's maximum token length ({max_length}).")
    

    tokens = tokenizer(text, return_tensors="pt", truncation=False, return_offsets_mapping=True)
    spans = tokens["offset_mapping"][0]

    input_ids = tokens['input_ids'][0]
    attention_mask = tokens['attention_mask'][0]


    total_tokens = input_ids.size(0)
    windows = np.maximum((total_tokens-context_length) // stride + 1, 0)

    
    batches = []
    for i in range(windows):
        start = i * stride
        end = start + context_length
        batches.append((
            input_ids[start:end].unsqueeze(0),
            attention_mask[start:end].unsqueeze(0) 
        ))
    # batches.append((
    #         input_ids[-context_length:].unsqueeze(0),
    #         attention_mask[-context_length:].unsqueeze(0) 
    #     ))
    all_ids = torch.vstack([ids for ids, mask in batches])
    all_masks = torch.vstack([mask for ids, mask in batches])


    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    emb_chunks = []
    with torch.inference_mode():         
        for i in tqdm(range(0, all_ids.size(0), batch_size), total=(all_ids.size(0) + batch_size - 1) // batch_size, desc="Embedding batches"):
            print('\n')
            print(i, i+batch_size)
            ids = all_ids[i:i+batch_size].to(device)
            masks = all_masks[i:i+batch_size].to(device)

            out = model(input_ids=ids, attention_mask=masks)
            emb = out.last_hidden_state
            print(emb.shape)

            emb_chunks.append(emb.detach().cpu())   # move to CPU immediately
            torch.cuda.empty_cache()

    embeddings = torch.cat(emb_chunks, dim=0) 
    print(embeddings.shape)



    embeddings = embeddings.reshape(-1, 1024)
    embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=-1)


    return embeddings, spans[:embeddings.shape[0]]


if __name__ == '__main__':

    with open("docs\\cloud_computing.txt", "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()


    embed(content, 512, 512, 12)

