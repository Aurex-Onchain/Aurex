from fastapi import APIRouter

router = APIRouter()


@router.get("/context")
async def get_market_context():
    return {
        "chains": ["xlayer", "ethereum", "base"],
        "activeSignals": 0,
        "riskLevel": "low",
        "hookPools": 0,
        "timestamp": None,
    }
