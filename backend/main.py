from chat.core import ChatSession
from chat.keys import SECRET
from database import Database
from openai import OpenAI



# CONFIGURATION


# Database
top_k = 5
surrounding_k = 2
storage_path = "C:\\Users\\mwsch\\iCloudDrive\\python_projects\\rag\\storage"
embedding_model = 'intfloat/multilingual-e5-large-instruct'



# LLM
system_prompt = "You are Nextor, a RAG agent that helps navigate documents and provide accurate answers based on information you can retrieve from them. Answer all question based on retrieved information."
model = "gpt-5-nano"
# model = "gpt-5-mini"



tools_instructions = [
        {
            "type": "function",
            "name": "vector_search",
            "description": "Perform a RAG vector search to retrieve relevant documents based on a query.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The text query to search for in the vector database"
                    }
                },
                "required": ["query"]
            }
        }
    ]


###########################################################################################################################################################################



db = Database(top_k = top_k, 
              surrounding_k = surrounding_k, 
              storage_path = storage_path,
              model_name=embedding_model)


tools_dict = {
    'vector_search': db.query
}


client = OpenAI(api_key=SECRET)
chat_session = ChatSession(system_prompt = system_prompt,
                          tools_instructions = tools_instructions,
                          tools_dict = tools_dict,
                          model = model)



while True:
    message = input('message: ')
    response = chat_session.send_message(message, client)
    for delta in response:
        print(delta, end="", flush=True)
    print('\n\n')
