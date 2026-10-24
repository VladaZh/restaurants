from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from api.routers import router
from db.db_models import Base
from db.session import engine

app = FastAPI()
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

Base.metadata.create_all(bind=engine)

app.include_router(router)
