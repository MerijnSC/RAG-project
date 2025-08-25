import numpy as np
import os
import pickle
from utils import RangeDict
from transformers import AutoTokenizer, AutoModel
import torch
import time
from pprint import pprint

class Database:
    def __init__(self, top_k=5, surrounding_k=2, storage_path: str = 'storage', model_name: str = "Qwen/Qwen3-0.6B"):
        self.top_k = top_k
        self.surrounding_k = surrounding_k

        self.tokenizer = AutoTokenizer.from_pretrained(model_name)

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = AutoModel.from_pretrained(model_name).to(self.device)

        self.model.eval()


        embedding_dimensions = self.model.config.hidden_size
        self.embeddings = torch.empty((0, embedding_dimensions), device=self.device, dtype=torch.float32)
        self.spans = np.empty((0, 2), dtype=int)
        self.rd = RangeDict()

        for entry in os.scandir(storage_path):
            if entry.is_dir():
                folder_path = entry.path
                md_path = os.path.join(folder_path, 'text.md')
                pkl_path = os.path.join(folder_path, 'data.pkl')

                if os.path.exists(md_path) and os.path.exists(pkl_path):
                    with open(pkl_path, "rb") as f:
                        data = pickle.load(f)


                    self.embeddings = torch.cat([self.embeddings, data['embeddings'].to(self.device)], dim=0)
                    self.spans = np.concatenate([self.spans, data['spans']], axis=0)

                    nr_embeddings = data['spans'].shape[0]

                    if self.rd.ends:
                        last_end = self.rd.ends[-1]+1
                    else:
                        last_end = 0

                    self.rd.add_range(last_end, last_end+nr_embeddings, md_path)



    def query(self, query: str):

        inputs = self.tokenizer(query, return_tensors="pt", truncation=True).to(self.device)

        with torch.inference_mode():
            outputs = self.model(**inputs)
            query_embedding = torch.nn.functional.normalize(outputs.last_hidden_state.mean(dim=1), p=2, dim=-1)

            cos_sim = torch.matmul(self.embeddings, query_embedding.T).squeeze(1)
            values, indices = [t.cpu().numpy() for t in torch.topk(cos_sim, k=self.top_k)]


        ret = {}
        for i in range(len(indices)):
            index = indices[i]
            value = values[i]


            start = self.spans[max(index-self.surrounding_k, 0)][0] # MOET GEFIXT WORDEN: MOET ALLEEN BINNEN ZELFDE DOCUMENT KUNNEN KIJKEN
            end   = self.spans[min(index+self.surrounding_k, len(self.spans))][1]

            file = self.rd[index]
            with open(file, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()


            ret[i+1] = {'sim_score': round(float(value), 3),
                      'file': file,
                      'span': (int(start), int(end)),
                      'text': content[start:end]}
        
        print('\n\n')
        print(query)
        pprint(ret)
        print('\n\n')

        return ret

            



if __name__ == '__main__':


    
    model_name = "intfloat/multilingual-e5-large-instruct"
    # model_name = 'Qwen/Qwen3-0.6B'
    db = Database(model_name=model_name, surrounding_k=0, top_k=25)

    task_description = 'Given a search query, retrieve relevant passages that answer the query'

    while True:
        
        q = input('Query: ')
        start = time.time()
        ret = db.query(f'Instruct: {task_description}\nQuery: {q}')
        # ret = db.query(q)
        print(time.time()-start)

        pprint(ret)
        print('\n\n\n')


