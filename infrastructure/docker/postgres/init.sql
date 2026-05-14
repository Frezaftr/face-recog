-- ─────────────────────────────────────────────────────────────
--  FaceSearch — PostgreSQL 16 + pgvector schema
--  Run automatically on first docker-compose up
-- ─────────────────────────────────────────────────────────────

-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;          -- pgvector ANN search
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";     -- UUID generation

-- ── users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tenant_id     UUID         NOT NULL DEFAULT uuid_generate_v4(),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email     ON users(email);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);

-- ── images ───────────────────────────────────────────────────
CREATE TYPE image_status AS ENUM ('pending', 'processing', 'done', 'failed');

CREATE TABLE IF NOT EXISTS images (
    id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id         UUID         NOT NULL,
    filename          VARCHAR(255) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    storage_key       VARCHAR(500) NOT NULL,
    mime_type         VARCHAR(100) NOT NULL,
    file_size         BIGINT       NOT NULL DEFAULT 0,
    status            image_status NOT NULL DEFAULT 'pending',
    face_count        INTEGER      NOT NULL DEFAULT 0,
    error_message     TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_images_user_id   ON images(user_id);
CREATE INDEX idx_images_tenant_id ON images(tenant_id);
CREATE INDEX idx_images_status    ON images(status);
CREATE INDEX idx_images_created   ON images(created_at DESC);

-- ── faces ────────────────────────────────────────────────────
-- One row per detected face per image
CREATE TABLE IF NOT EXISTS faces (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_id     UUID        NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    user_id      UUID        NOT NULL,
    tenant_id    UUID        NOT NULL,
    -- bounding box: { x, y, width, height, confidence }
    bounding_box JSONB       NOT NULL,
    -- 5-point landmarks from RetinaFace [[x,y], ...]
    landmarks    JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_faces_image_id   ON faces(image_id);
CREATE INDEX idx_faces_user_id    ON faces(user_id);
CREATE INDEX idx_faces_tenant_id  ON faces(tenant_id);

-- ── face_embeddings (pgvector) ───────────────────────────────
-- 512-dimensional ArcFace embeddings (InsightFace buffalo_l)
-- Stored as L2-normalised vectors; cosine similarity = dot product
CREATE TABLE IF NOT EXISTS face_embeddings (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    face_id    UUID        NOT NULL REFERENCES faces(id) ON DELETE CASCADE,
    image_id   UUID        NOT NULL,
    user_id    UUID        NOT NULL,
    tenant_id  UUID        NOT NULL,
    embedding  vector(512) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HNSW index — approximate nearest neighbour with cosine distance
-- m=16  : connections per layer (higher = better recall, more RAM)
-- ef_construction=64 : beam width during build (higher = better quality)
-- Tradeoff vs IVF: HNSW never needs retraining, better recall at low latency
CREATE INDEX idx_face_embeddings_hnsw
    ON face_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Partition-friendly indexes for tenant isolation
CREATE INDEX idx_face_embeddings_tenant ON face_embeddings(tenant_id);
CREATE INDEX idx_face_embeddings_user   ON face_embeddings(user_id);
CREATE INDEX idx_face_embeddings_face   ON face_embeddings(face_id);

-- ── search_logs ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_logs (
    id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id              UUID        NOT NULL,
    tenant_id            UUID        NOT NULL,
    query_embedding_hash VARCHAR(64),          -- sha256 of raw embedding bytes
    results_count        INTEGER     NOT NULL DEFAULT 0,
    latency_ms           INTEGER,
    top_k                INTEGER     NOT NULL DEFAULT 10,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_search_logs_user_id    ON search_logs(user_id);
CREATE INDEX idx_search_logs_tenant_id  ON search_logs(tenant_id);
CREATE INDEX idx_search_logs_created_at ON search_logs(created_at DESC);

-- ── Auto-update updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION _set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

CREATE TRIGGER trg_images_updated_at
    BEFORE UPDATE ON images
    FOR EACH ROW EXECUTE FUNCTION _set_updated_at();
