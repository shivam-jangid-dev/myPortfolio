import os
import asyncio
import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Shivam Jangid — Portfolio Backend",
    description="FastAPI backend powering Resume Analyser and GitHub Repo Explainer AI tools.",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Set ALLOWED_ORIGINS in your Railway environment (comma-separated URLs).
# e.g. ALLOWED_ORIGINS=https://shivam.vercel.app,https://shivam.dev
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "https://shivamjangid.netlify.app,http://localhost:5173,http://localhost:3000",
)
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

# ── Rate limiting ─────────────────────────────────────────────────────────────
from middleware.rate_limiter import limiter   # noqa: E402
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Routes ────────────────────────────────────────────────────────────────────
# Import order matters: service modules register their routes on their own
# routers, which are then explicitly included here.
from api.routes import router as main_router                    # noqa: E402  /health
from services.repo_explainer_serv import router as repo_router  # noqa: E402  /repo-explain
from services.repo_explainer_serv import session_cleanup_loop   # noqa: E402
from services.resume_ana_serv import router as resume_router    # noqa: E402  /resume-analysis

app.include_router(main_router)
app.include_router(repo_router)
app.include_router(resume_router)


# ── Startup events ────────────────────────────────────────────────────────────
@app.on_event("startup")
async def _start_background_tasks():
    """Launch periodic cleanup for expired sessions and repo cache."""
    asyncio.create_task(session_cleanup_loop())


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    # host="0.0.0.0" is required for Render to reach the container.
    # reload=False in production (reload=True is dev-only).
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)