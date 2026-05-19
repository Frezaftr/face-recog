// ── Face types ────────────────────────────────────────────────────────────────

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface Landmarks {
  /** 5 points: [[x,y], ...] — left_eye, right_eye, nose, mouth_left, mouth_right */
  points: number[][];
}

export interface FaceRecord {
  id: string;
  imageId: string;
  userId: string;
  tenantId: string;
  boundingBox: BoundingBox;
  landmarks: number[][] | null;
  createdAt: string;
}

/** 512-dimensional ArcFace embedding */
export type FaceEmbedding = number[];

export interface FaceWithEmbedding extends FaceRecord {
  embedding: FaceEmbedding;
}
