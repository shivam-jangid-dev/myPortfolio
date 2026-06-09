import uvicorn
from fastapi import FastAPI
from api.routes import router

app = FastAPI()

# Connect your API routes to the main app
app.include_router(router)

if __name__ == "__main__":
    # You set the port right here (e.g., port 8080)
    uvicorn.run("main:app", host="127.0.0.1", port=8080, reload=True)