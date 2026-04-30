import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.analyze import router as analyze_router

load_dotenv()

app = FastAPI(title="First Principle Trader API")

default_origins = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://brilliance3.github.io",
}
env_origins = {
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
}
origins = sorted(default_origins | env_origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)


@app.get("/health")
def health() -> dict:
    return {"ok": True}
