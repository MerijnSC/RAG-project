from flask import Flask, render_template, request, session, jsonify, stream_with_context
from flask_session import Session
from flask_cors import CORS
from chat.core import ChatSession
from chat.keys import SECRET
from database import Database
from openai import OpenAI
import os



# CONFIGURATION

# Database
top_k = 5
surrounding_k = 2
storage_path = os.path.join("storage")
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


app = Flask(__name__)
CORS(app)


app.config['SECRET_KEY'] = 'testtest'
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)






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




@app.route('/send_message', methods=['POST'])
def send_message():
    data = request.get_json()
    # print(data)

    if not data or 'message' not in data:
        return jsonify({'error': 'No message provided'}), 400


    # return jsonify({'status': 'success', 'answer': answer}), 200
    return app.response_class(stream_with_context(chat_session.send_message(data['message'], client)), mimetype='text/plain')





if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)