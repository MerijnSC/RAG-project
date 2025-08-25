import numpy as np
from utils import embed, sentence_chunk
import time
import pickle




# model_name = "intfloat/multilingual-e5-large-instruct"
model_name = "Qwen/Qwen3-0.6B"


# context_length = 32768
context_length = 512

stride = context_length // 2


document_path = 'docs\\911Report.md'
with open(document_path, 'r', encoding='utf-8') as file:
    content = file.read()



with open("sentence_data.pkl", "rb") as f:
    data = pickle.load(f)

sentence_embeddings = data["sentence_embeddings"]
sentence_spans = data["sentence_spans"]


for start, end in sentence_spans:
    print(content[start: end])
    print('---')

    if 'conversation' in content[start: end]:
        break

# print(len(sentence_embeddings))
# print(len(sentence_spans))

exit()




start = time.time()

token_embeddings, token_spans = embed(content, context_length, stride, 12, model_name)
sentence_embeddings, sentence_spans = sentence_chunk(content, token_embeddings, token_spans)


print(time.time()-start)



# Data to save
data = {
    "sentence_embeddings": sentence_embeddings.cpu(),  # move to CPU if on GPU
    "sentence_spans": sentence_spans
}

# Save to a file
with open("sentence_data.pkl", "wb") as f:
    pickle.dump(data, f)