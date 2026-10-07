from fastapi import FastAPI

from api.routers import router
from db.db_models import Base
from db.session import engine

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.include_router(router)
