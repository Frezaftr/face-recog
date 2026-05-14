import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.services.face_analyzer import FaceAnalyzerService
from app.routes import health, process, embed

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────────
    logger.info(f"Loading InsightFace model: {settings.model_name}")
    analyzer = FaceAnalyzerService(model_name=settings.model_name)
    analyzer.load_model()             # blocking — downloads model on first run
    app.state.analyzer = analyzer
    logger.info("Face model ready ✓")

    yield

    # ── Shutdown ──────────────────────────────────────────────
    logger.info("Face service shutting down")


app = FastAPI(
    title="FaceSearch — Face Service",
    description=(
        "Face detection (RetinaFace) + embedding (ArcFace 512-dim) "
        "powered by InsightFace buffalo_l"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(process.router)
app.include_router(embed.router)
