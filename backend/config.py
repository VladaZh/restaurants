from typing import Optional

from pydantic import PostgresDsn
from pydantic_settings import BaseSettings


class Config(BaseSettings):
    DATABASE_URL: Optional[PostgresDsn] = PostgresDsn(
        "postgresql://pgurl:password@localhost:5432/rest-service"
    )


config = Config()
