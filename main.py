from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.servers.xai import router as xai_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(xai_router, prefix="/v1") 