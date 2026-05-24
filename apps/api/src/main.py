from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.routers import health, market, signals, strategies, hook

app = FastAPI(
    title="Aurex API",
    description="AI-native onchain trading operating system powered by Uniswap V4 Hooks on X Layer",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(market.router, prefix="/market", tags=["Market"])
app.include_router(signals.router, prefix="/signals", tags=["Signals"])
app.include_router(strategies.router, prefix="/strategies", tags=["Strategies"])
app.include_router(hook.router, prefix="/hook", tags=["Hook"])
