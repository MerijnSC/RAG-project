from openai import OpenAI
from chat.keys import SECRET
import json






class ChatSession:
    def __init__(self, system_prompt, tools_instructions, tools_dict, model="gpt-5-nano", log_file_path=False):


        for tool in tools_instructions:
            if tool['name'] not in tools_dict.keys():
                raise KeyError(f"Tool '{tool['name']}' is not in tools_dict")


        self.message_list = [
            {"role": "system", "content": system_prompt}
        ]
        self.model = model

        self.tools_instructions = tools_instructions
        self.tools_dict = tools_dict

        
        
    def send_message(self, message, openai_client):
        self.message_list.append(
            {"role": "user",
            "content": message}
        )

        while True:
            stream = openai_client.responses.create(
                model=self.model,
                input=self.message_list,
                store=False,
                stream=True,
                tools=self.tools_instructions,
                reasoning={
                    'effort': 'minimal'
                }
            )

            function_call = False
            for event in stream:
                event_type = getattr(event, "type", "")
                match event_type:
                    case "response.output_text.delta":
                        yield event.delta

                    case "response.completed":
                        output = event.response.output
                        for item in output:
                            if getattr(item, "type", "") == "message":
                                text = ""
                                for part in getattr(item, "content", []):
                                    if getattr(part, "type", "") == "output_text":
                                        text += getattr(part, "text", "")
                                self.message_list.append({"role": "assistant", "content": text})

                            elif getattr(item, "type", "") == "function_call":
                                function_call = True
                                self.message_list.append({
                                    'type': 'function_call',
                                    'arguments': item.arguments,
                                    'call_id': item.call_id,
                                    'name': item.name
                                })

                                tool_res = {item.name: self.tools_dict[item.name](**json.loads(item.arguments))}
                                self.message_list.append({
                                    "type": "function_call_output",
                                    "call_id": item.call_id,
                                    "output": json.dumps(tool_res),
                                })
            
            if not function_call:
                break



if __name__ == '__main__':


    client = OpenAI(api_key=SECRET)
    model = "gpt-5-nano"


    system_prompt = 'Je bent een behulpzame assistent'

    tools = [
        {
            "type": "function",
            "name": "get_horoscope",
            "description": "Get today's horoscope for an astrological sign.",
            "parameters": {
                "type": "object",
                "properties": {
                    "sign": {
                        "type": "string",
                        "description": "An astrological sign like Taurus or Aquarius",
                    },
                },
                "required": ["sign"],
            },
        },
        {
            "type": "function",
            "name": "get_random_joke",
            "description": "Return a random joke to brighten someone's day.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    ]


    def get_horoscope(sign):
        return f'{sign} gaat hun teen stoten morgen.'

    def get_random_joke():
        return 'Het is groen en gaat van de berg. Skiwi.'


    tools_dict = {
        'get_horoscope': get_horoscope,
        'get_random_joke': get_random_joke
    }


    session = ChatSession(system_prompt, tools, tools_dict)

    while True:
        message = input('message: ')
        response = session.send_message(message, client)
        for delta in response:
            print(delta, end="", flush=True)
        print('\n\n')

