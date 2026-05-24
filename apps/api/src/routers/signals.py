from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class Signal(BaseModel):
    id: str
    chain: str
    pool_id: str | None = None
    token_address: str | None = None
    risk_score: int
    alpha_score: int
    liquidity_score: int
    volatility_score: int
    expires_at: int | None = None
    signer: str | None = None


@router.get("")
async def list_signals():
    return {"signals": [], "total": 0}


@router.get("/{signal_id}")
async def get_signal(signal_id: str):
    return {"error": "not_found", "message": f"Signal {signal_id} not found"}
