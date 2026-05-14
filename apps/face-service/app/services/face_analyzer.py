import logging
from typing import List, Optional

import cv2
import numpy as np
from insightface.app import FaceAnalysis

logger = logging.getLogger(__name__)


class FaceAnalyzerService:
    """
    Wraps InsightFace FaceAnalysis (buffalo_l model):

    Pipeline (single forward pass via app.get(img)):
        1. RetinaFace  — detects face bounding boxes + 5-point landmarks
        2. ArcFace     — produces 512-dim L2-normalised embedding per face

    Why InsightFace?
    - Single library handles both detection AND recognition
    - ArcFace embeddings are state-of-the-art for face verification
    - Supports CPU (ONNX) and GPU (CUDA) automatically
    - L2-normalised embeddings → cosine similarity = simple dot product
    """

    def __init__(self, model_name: str = "buffalo_l") -> None:
        self.model_name = model_name
        self._app: Optional[FaceAnalysis] = None

    def load_model(self) -> None:
        """
        Download (first run) and initialise the face analysis model.
        This is blocking and should be called once at startup.
        """
        self._app = FaceAnalysis(
            name=self.model_name,
            providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
        )
        # ctx_id=0 → use first CUDA GPU if available, else CPU fallback
        self._app.prepare(ctx_id=0, det_size=(640, 640))
        logger.info(f"InsightFace '{self.model_name}' model loaded")

    def is_ready(self) -> bool:
        return self._app is not None

    # ── Public methods ───────────────────────────────────────────

    def process_all(self, image_data: bytes) -> List[dict]:
        """
        Detect every face in the image.
        Used by the Worker to index a newly uploaded photo.

        Returns a list of dicts, one per face:
            {
                "bbox":      { x, y, width, height, confidence },
                "landmarks": [[x, y], ...] or None,
                "embedding": [f0, f1, ..., f511]   # 512-dim, L2-normalised
            }
        """
        img   = self._decode(image_data)
        faces = self._app.get(img)

        results = []
        for face in faces:
            b = face.bbox.astype(int)
            results.append({
                "bbox": {
                    "x":          int(b[0]),
                    "y":          int(b[1]),
                    "width":      int(b[2] - b[0]),
                    "height":     int(b[3] - b[1]),
                    "confidence": round(float(face.det_score), 4),
                },
                "landmarks": face.kps.tolist() if face.kps is not None else None,
                # normed_embedding is already L2-normalised by InsightFace
                "embedding": face.normed_embedding.tolist(),
            })

        logger.debug(f"process_all → {len(results)} face(s) detected")
        return results

    def embed_primary(self, image_data: bytes) -> List[float]:
        """
        Extract embedding for the single most prominent face.
        Used by the API Gateway for search queries.

        Selects the face with the highest detection confidence.
        Raises ValueError if no face is detected.
        """
        img   = self._decode(image_data)
        faces = self._app.get(img)

        if not faces:
            raise ValueError(
                "No face detected in the query image. "
                "Please upload a clear, front-facing photo."
            )

        # Pick the most confidently detected face
        primary = max(faces, key=lambda f: float(f.det_score))

        logger.debug(
            f"embed_primary → confidence={float(primary.det_score):.3f}"
        )
        return primary.normed_embedding.tolist()

    # ── Private helpers ──────────────────────────────────────────

    @staticmethod
    def _decode(data: bytes) -> np.ndarray:
        arr = np.frombuffer(data, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError(
                "Could not decode image — file may be corrupt or in an unsupported format."
            )
        return img
