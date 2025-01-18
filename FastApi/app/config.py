from pydantic_settings import BaseSettings # type: ignore
# Define class to deal with system parmeters (Database connection, Tokens creation, Hashing)
class Settings(BaseSettings):
    database_hostname: str
    database_port: str
    database_password: str
    database_name: str
    database_username: str
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int

    class Config:
        env_file = ".env"


settings = Settings()
