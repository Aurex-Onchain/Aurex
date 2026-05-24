from fastapi import APIRouter

router = APIRouter()


@router.get("/pools")
async def list_hook_pools():
    return {"pools": [], "total": 0}


@router.get("/pools/{pool_id}")
async def get_hook_pool(pool_id: str):
    return {"error": "not_found", "message": f"Pool {pool_id} not found"}


@router.get("/events")
async def list_hook_events():
    return {"events": [], "total": 0}


@router.post("/signals")
async def submit_signal():
    return {"status": "stub", "message": "Signal submission not yet implemented"}
