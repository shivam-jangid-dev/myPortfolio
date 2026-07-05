from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Lightweight liveness probe used by Railway (and other platforms) to confirm
    the container is up and accepting connections.
    """
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}
