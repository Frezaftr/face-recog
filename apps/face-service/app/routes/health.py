from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/health", tags=["health"])
async def health(request: Request):
    analyzer = getattr(request.app.state, "analyzer", None)
    model_ready = analyzer is not None and analyzer.is_ready()
    return {
        "status":      "ok" if model_ready else "loading",
        "model":       analyzer.model_name if analyzer else None,
        "model_ready": model_ready,
    }
