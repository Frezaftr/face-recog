You are a Staff-level Software Engineer (FAANG-level) tasked to design and implement a production-grade Face Recognition Search System similar to Apple Photos / Google Photos.

Your goal is to generate a COMPLETE, SCALABLE, and CLEAN architecture + repository.

---

# 🗂️ IMPLEMENTATION PHASES

> Execute **one phase at a time**. Say `phase N` to start each phase.

| # | Phase | Files Created | Status |
|---|-------|---------------|--------|
| **1** | Root & Infrastructure config | `docker-compose.yml`, `.env.example`, `package.json`, `infrastructure/docker/nginx.conf`, `infrastructure/docker/postgres/init.sql` | ✅ Done |
| **2** | API Gateway (NestJS) | Full NestJS app — `src/main.ts`, auth module, images module, search module, entities, kafka service, storage service, guards, DTOs, `Dockerfile` | ✅ Done |
| **3** | Face Service (FastAPI / AI) | Python FastAPI — InsightFace detection + ArcFace 512-dim embedding, pgvector writes, `Dockerfile`, `requirements.txt` | ✅ Done |
| **4** | Worker (Kafka consumer) | Python async worker — consumes `image.uploaded` topic, calls face service, stores embeddings, `Dockerfile` | ✅ Done |
| **5** | Web Frontend (Next.js) | Next.js 14 App Router — upload page, search page, `ImageUploader`, `SearchResults`, API client, `Dockerfile` | ✅ Done |
| **6** | Shared packages | `packages/shared-types` (TypeScript types), `packages/config` (env helpers) | ✅ Done |
| **7** | Infrastructure — K8s + Terraform | Kubernetes manifests (deployments, services, ingress, configmaps), Terraform IaC for cloud | ✅ Done |
| **8** | Scripts & seeds | `scripts/seed.py` — demo data, `scripts/test-upload.sh` — smoke test | ⬜ Not started |

---

## 📋 PHASE 4 — Worker (Kafka Consumer)

### Overview
Async background worker that bridges Kafka ↔ Face Service ↔ PostgreSQL.
Consumes `image.uploaded` events, calls the face service, and persists results.

### Location
`apps/worker/`

### Files to Create

| File | Purpose |
|------|---------|
| `requirements.txt` | aiokafka, asyncpg, httpx, pydantic-settings, tenacity |
| `Dockerfile` | python:3.11-slim, non-root user |
| `main.py` | Entry point — starts Kafka consumer loop |
| `app/core/config.py` | Pydantic settings (Kafka, DB, face-service URL) |
| `app/consumer.py` | `AIOKafkaConsumer` — topic `image.uploaded`, group `worker-group` |
| `app/handlers/image_handler.py` | Main handler: download from MinIO → POST /process → save faces+embeddings |
| `app/db/database.py` | asyncpg pool, `get_pool()` |
| `app/db/queries.py` | `update_image_status()`, `insert_face()`, `insert_embedding()` |
| `app/services/storage_client.py` | MinIO `get_object()` helper |
| `app/services/face_client.py` | httpx POST to face-service `/process` with retry (tenacity) |

### Data Flow

```
Kafka topic: image.uploaded
  ↓ (event: { imageId, storageKey, tenantId, userId })
Worker consumer
  ↓
MinIO: GET object by storageKey → raw image bytes
  ↓
Face Service: POST /process → [{ bbox, landmarks, embedding }]
  ↓
PostgreSQL:
  - INSERT INTO faces (imageId, tenantId, bbox, landmarks)
  - INSERT INTO face_embeddings (faceId, embedding::vector(512))
  - UPDATE images SET status='done', face_count=N WHERE id=imageId
  (on error → UPDATE images SET status='failed', error_message=...)
```

### Key Design Decisions
- **aiokafka** — async Kafka client, no blocking the event loop
- **asyncpg** — async PostgreSQL, connection pool (min=2, max=10)
- **httpx AsyncClient** — async HTTP calls to face-service
- **tenacity** — retry face-service calls (3 retries, exponential backoff) before marking image as `failed`
- **At-least-once delivery** — commit offset only after DB write succeeds
- **Graceful shutdown** — SIGTERM → finish current message → stop consumer

### Environment Variables Needed (add to `.env.example`)
```
WORKER_KAFKA_BROKERS=kafka:9092
WORKER_KAFKA_GROUP_ID=worker-group
WORKER_KAFKA_TOPIC=image.uploaded
WORKER_FACE_SERVICE_URL=http://face-service:8000
WORKER_DATABASE_URL=postgresql://user:pass@postgres:5432/facesearch
WORKER_MINIO_ENDPOINT=minio:9000
WORKER_MINIO_ACCESS_KEY=...
WORKER_MINIO_SECRET_KEY=...
WORKER_MINIO_BUCKET=facesearch
WORKER_CONCURRENCY=4
```

---

---

# 🧠 PROBLEM STATEMENT

Build a system where:

* Users upload thousands to millions of images
* System automatically detects faces and generates embeddings
* User can upload a query face image
* System returns all matching photos containing that person

This is NOT just face detection — this is:

* Face Detection
* Face Embedding (Recognition)
* Vector Similarity Search

---

# 🎯 REQUIREMENTS

## Functional Requirements

1. Upload image(s)
2. Detect multiple faces per image
3. Generate embeddings per face
4. Store embeddings
5. Search similar faces via query image
6. Return top-K matching images with similarity score
7. Support pagination
8. Support multi-user isolation (tenant-based)

---

## Non-Functional Requirements

* Scale to 10M+ images
* < 300ms query latency (P95)
* Highly available (99.9%)
* Eventually consistent indexing
* Secure biometric data
* Horizontal scalability

---

# 🏗️ SYSTEM DESIGN (MANDATORY OUTPUT)

You MUST produce:

## 1. High-Level Architecture

* Microservices-based architecture
* Components:

  * API Gateway
  * Auth Service
  * Image Upload Service
  * Face Processing Service (AI)
  * Vector Search Service
  * Metadata Service
  * Worker Queue
  * Vector Database
  * Relational DB

Explain data flow step-by-step.

---

## 2. Detailed Data Flow

### Upload Flow:

User → API → Storage → Queue → Face Processing → Embedding → Vector DB

### Search Flow:

User → API → Face Processing → Embedding → Vector DB → Results

---

## 3. Database Design

### Relational DB (mySQL)

Tables:

* users
* images
* faces
* search_logs

### Vector DB

* face_embeddings (vector + metadata)

Explain indexing strategy (HNSW / IVF) and tradeoffs. ([InfraSketch][1])

---

## 4. API Design (REST or gRPC)

Define endpoints:

* POST /upload
* POST /search
* GET /images
* GET /faces

Include request/response schema.

---

## 5. AI Pipeline

Explain:

* Face detection (RetinaFace / MTCNN)
* Face alignment
* Embedding model (InsightFace / FaceNet)
* Vector normalization

Explain why embeddings are used and how similarity search works. ([Milvus][2])

---

## 6. Scalability Design

You MUST include:

* Load balancer
* Horizontal scaling
* Sharding strategy
* Caching (Redis)
* Async processing via queue (Kafka / RabbitMQ)

Explain bottlenecks and solutions.

---

## 7. Performance Optimization

* ANN search vs brute force
* GPU usage for embedding
* Batch processing
* CDN for images

---

## 8. Security & Privacy

* Encrypt embeddings at rest
* Signed URLs for image access
* Role-based access
* GDPR considerations

---

## 9. Failure Handling

* Retry queue
* Dead letter queue
* Idempotency
* Service fallback

---

# 📦 REPOSITORY STRUCTURE (VERY IMPORTANT)

Generate a MONOREPO structure:

/apps
/api-gateway (NestJS)
/face-service (Python FastAPI)
/worker (queue consumer)
/web (NextJS)

/packages
/shared-types
/utils
/config

/infrastructure
/docker
/k8s
/terraform

Include:

* Dockerfiles
* docker-compose
* env examples

---

# ⚙️ TECH STACK (STRICT)

* Backend: NestJS
* AI Service: Python (FastAPI)
* Vector DB: pgvector OR Milvus
* Queue: Kafka or RabbitMQ
* Cache: Redis
* Frontend: NextJS

---

# 🧪 EXTRA (VERY IMPORTANT)

Also generate:

* Sample code for:

  * Upload flow
  * Face embedding generation
  * Vector search query
* Seed script
* README.md (like real open-source project)
* Architecture diagram (ASCII)

---

# 🧠 ENGINEERING STANDARD

* Clean code
* Modular
* Production-ready
* No toy examples
* Think like Meta / Google infra engineer

---

# ⚠️ OUTPUT RULES

* Be EXTREMELY detailed
* Do NOT skip steps
* Do NOT oversimplify
* Include tradeoffs
* Include reasoning for every major decision

---

Your output should feel like:
"Senior Staff Engineer design doc + production repo scaffold"

[1]: https://infrasketch.net/blog/vector-database-system-design?utm_source=chatgpt.com "Vector Database System Design: Architecture for AI Applications | InfraSketch Blog"
[2]: https://milvus.io/ai-quick-reference/how-can-face-recognition-systems-integrate-with-vector-search?utm_source=chatgpt.com "How can face recognition systems integrate with vector search?"
