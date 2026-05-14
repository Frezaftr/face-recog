from pydantic import BaseModel
from typing import List, Optional


class BoundingBox(BaseModel):
    x:          int
    y:          int
    width:      int
    height:     int
    confidence: float


class FaceDetection(BaseModel):
    bbox:       BoundingBox
    landmarks:  Optional[List[List[float]]] = None
    # 512-dim L2-normalised ArcFace vector
    # Cosine similarity = dot product (since already normalised)
    embedding:  List[float]


class ProcessResponse(BaseModel):
    """Response from POST /process — all faces in an image."""
    faces:      List[FaceDetection]
    face_count: int


class EmbedResponse(BaseModel):
    """Response from POST /embed — single embedding for search query."""
    embedding:  List[float]
