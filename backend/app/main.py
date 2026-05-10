from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import auth, aws_accounts, costs, kubernetes, recommendations, alerts


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="OpsNova API",
    description="AI-Powered Cloud Operations Intelligence Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(aws_accounts.router, prefix="/api/v1/aws", tags=["aws"])
app.include_router(costs.router, prefix="/api/v1/costs", tags=["costs"])
app.include_router(kubernetes.router, prefix="/api/v1/kubernetes", tags=["kubernetes"])
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["recommendations"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
