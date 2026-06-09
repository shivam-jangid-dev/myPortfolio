from model_init import model_initialization
from pydantic import BaseModel

class ResumeAnalysis(BaseModel):
    score:int
    feedback:str
    suggestion:str

def resume_analyzer(resume_text:str, job_description:str=None):
    # without job description
    system_prompt="""
    You are a Professional Resume analyzer and You have to Analyze the Resume of a candidate and give him/her the score out of 100 and 
    feedback for each section and suggestions in json format with keys:"score"(int),"feedback"(str),"suggestion"(str)
    """

    # with job description
    system_prompt_with_jd="""
    You are a Professional Resume analyzer and You have to Analyze the Resume of a candidate according the job Description:{job_description} and give him/her the score out of 100 and 
    feedback for each section and suggestions in json format with keys:"score"(int),"feedback"(str),"suggestion"(str)
    """
    if job_description:
        model=model_initialization(system_prompt_with_jd,response_format=ResumeAnalysis)
    else:
        model=model_initialization(system_prompt,response_format=ResumeAnalysis)
    response = model.invoke([resume_text])
    return response.content