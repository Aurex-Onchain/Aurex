from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    aurex_env: str = "development"
    cors_origins: str = "http://localhost:3000"

    xlayer_rpc_url: str = "https://rpc.xlayer.tech"
    xlayer_testnet_rpc_url: str = "https://testrpc.xlayer.tech"
    xlayer_chain_id: int = 196
    xlayer_testnet_chain_id: int = 195

    class Config:
        env_file = ".env"


settings = Settings()
