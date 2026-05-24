from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class GenerateStrategyRequest(BaseModel):
    objective: str = "risk_aware_swap"
    chain: str = "xlayer"
    token_in: str = "USDC"
    token_out: str = "AUREX"
    amount_usd: float = 100.0


@router.post("/generate")
async def generate_strategy(req: GenerateStrategyRequest):
    return {
        "id": None,
        "status": "stub",
        "message": "Strategy generation not yet implemented",
        "request": req.model_dump(),
    }


@router.post("/simulate")
async def simulate_strategy():
    return {"status": "stub", "message": "Strategy simulation not yet implemented"}
