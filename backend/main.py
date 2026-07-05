import uvicorn
from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from api.routes import router
from middleware.rate_limiter import limiter

app = FastAPI()

# Attach the rate limiter to the app state and register its 429 error handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Connect your API routes to the main app
app.include_router(router)

if __name__ == "__main__":
    # You set the port right here (e.g., port 8080)
    uvicorn.run("main:app", host="127.0.0.1", port=8080, reload=True)