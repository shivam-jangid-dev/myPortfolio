from langchain.chat_models import init_chat_model
from dotenv import load_dotenv
load_dotenv()


def model_initialization(system_prompt:str, model_name:str ="",response_format:str ="{}"):
    model=init_chat_model(
        model=model_name,
        temperature=1,
        system_prompt=system_prompt,
        response_format=response_format
    )
    return model

