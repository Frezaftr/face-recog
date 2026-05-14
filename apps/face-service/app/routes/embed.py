from fastapi import APIRouter, UploadFile, File, HTTPException, Request

from app.models.schemas import EmbedResponse

router = APIRouter()

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB for search queries


@router.post("/embed", response_model=EmbedResponse, tags=["embed"])
async def embed_face(request: Request, file: UploadFile = File(...)):
    """
    Extract a 512-dim ArcFace embedding for the **primary face** in a query image.

    Called by the **API Gateway** when the user performs a face search.

    - Picks the face with the highest detection confidence score.
    - Returns 422 if no face is detected in the image.

    Data flow:
        API Gateway → POST /embed → RetinaFace detect → pick primary → ArcFace embed → return
    """
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported media type '{file.content_type}'. Use JPEG, PNG, WebP, or BMP.",
        )

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")

    try:
        analyzer = request.app.state.analyzer
        embedding = analyzer.embed_primary(data)
    except ValueError as exc:
        # No face detected
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {exc}")

    return EmbedResponse(embedding=embedding)
