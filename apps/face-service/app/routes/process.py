from fastapi import APIRouter, UploadFile, File, HTTPException, Request

from app.models.schemas import ProcessResponse, FaceDetection, BoundingBox

router = APIRouter()

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/process", response_model=ProcessResponse, tags=["process"])
async def process_image(request: Request, file: UploadFile = File(...)):
    """
    Detect ALL faces in an uploaded image.

    Called by the **Worker** for every newly uploaded photo.
    Returns bounding boxes, 5-point landmarks, and 512-dim ArcFace embeddings
    for every detected face.

    Data flow:
        Worker → POST /process → RetinaFace detect → ArcFace embed → return faces[]
    """
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported media type '{file.content_type}'. Use JPEG, PNG, WebP, or BMP.",
        )

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 50 MB)")

    try:
        analyzer = request.app.state.analyzer
        raw_faces = analyzer.process_all(data)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Face processing failed: {exc}")

    faces = [
        FaceDetection(
            bbox=BoundingBox(**f["bbox"]),
            landmarks=f["landmarks"],
            embedding=f["embedding"],
        )
        for f in raw_faces
    ]

    return ProcessResponse(faces=faces, face_count=len(faces))
