# FaceSearch — Production-Grade Face Recognition Search System

A scalable, microservices-based face recognition search system. Upload thousands of images, automatically index faces, then search any photo by face to find all matching images — similar to Apple Photos / Google Photos.

---

## ASCII Architecture Diagram

```
                     ┌──────────────────────────────────────────────┐
                     │              CLIENT LAYER                     │
                     │   Browser  /  Mobile  /  API Consumer         │
                     └──────────────────┬───────────────────────────┘
                                        │ HTTPS
                     ┌──────────────────▼───────────────────────────┐
                     │         NGINX  (Load Balancer / SSL)          │
                     └────────┬─────────────────────────┬───────────┘
                              │                         │
               ┌──────────────▼──────────┐  ┌──────────▼──────────┐
               │  API Gateway (NestJS)   │  │  Web App (Next.js)  │
               │  :3000                  │  │  :3001              │
               └──┬──────────┬───────────┘  └─────────────────────┘
                  │          │
       ┌──────────▼──┐  ┌────▼──────────────────────────────┐
       │  Auth       │  │  Images / Search / Faces           │
       │  Service    │  │  (NestJS modules)                  │
       └─────────────┘  └─────┬───────────────────┬──────────┘
                               │                   │
                    ┌──────────▼──────┐   ┌────────▼──────────────┐
                    │  Kafka Topic    │   │  Face Service          │
                    │  image.uploaded │   │  (FastAPI / AI)        │
                    └──────────┬──────┘   │  InsightFace + ArcFace │
                               │          └────────┬──────────────-┘
                    ┌──────────▼──────┐            │ 512-dim embedding
                    │  Worker         │            │
                    │  (Consumer)     │───────────►│
                    └────────┬────────┘            │
                             │              ┌───────▼────────────┐
                    ┌────────▼────────┐     │  PostgreSQL 16     │
                    │  MinIO          │     │  + pgvector (HNSW) │
                    │  (Object Store) │     │  face_embeddings   │
                    └─────────────────┘     └────────────────────┘
                                                    ▲
                    ┌────────────────────────────────┤
                    │  Redis (Cache — search results,│
                    │  signed URLs, rate limiting)   │
                    └────────────────────────────────┘
```

---

## Upload Flow

```
User → POST /images/upload
     → API Gateway validates JWT, streams file to MinIO
     → Creates images record (status=pending) in PostgreSQL
     → Publishes { imageId, storageKey, userId, tenantId } to Kafka topic image.uploaded
     → Worker consumes event
     → Worker downloads image from MinIO
     → Worker calls Face Service POST /process → [{ bbox, landmarks, embedding }]
     → Worker stores each face row in faces table
     → Worker bulk-inserts embeddings into face_embeddings (pgvector)
     → Worker updates image status=done, face_count=N
```

## Search Flow

```
User → POST /search (multipart: query image)
     → API Gateway calls Face Service POST /embed → 512-dim vector
     → Cache check: Redis key = sha256(embedding)
     → On miss: pgvector ANN query (HNSW, cosine similarity, top-K)
     → Fetch image metadata + signed MinIO URLs
     → Cache result (TTL 5 min), log to search_logs
     → Return paginated results with similarity scores
```

---

## Tech Stack

| Layer           | Technology                          |
|-----------------|-------------------------------------|
| API Gateway     | NestJS 10, TypeORM, Passport-JWT    |
| AI Service      | Python FastAPI, InsightFace, OpenCV |
| Worker          | Python, aiokafka, asyncpg           |
| Frontend        | Next.js 14 (App Router), Tailwind   |
| Vector DB       | PostgreSQL 16 + pgvector (HNSW)     |
| Queue           | Apache Kafka (KRaft mode)           |
| Cache           | Redis 7                             |
| Object Storage  | MinIO (S3-compatible)               |
| Infrastructure  | Docker Compose, Kubernetes, Terraform |

---

## Repository Structure

```
facesearch/
├── apps/
│   ├── api-gateway/          # NestJS — auth, upload, search REST API
│   ├── face-service/         # Python FastAPI — face detection + embedding
│   ├── worker/               # Python — Kafka consumer, processes images
│   └── web/                  # Next.js 14 — upload UI + search UI
├── packages/
│   ├── shared-types/         # TypeScript type definitions
│   └── config/               # Shared environment config helpers
├── infrastructure/
│   ├── docker/               # nginx.conf, postgres/init.sql
│   ├── k8s/                  # Kubernetes manifests
│   └── terraform/            # IaC for cloud deployment
├── scripts/
│   ├── seed.py               # Insert demo users + images
│   └── test-upload.sh        # Quick smoke test
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Quick Start

### Prerequisites

- Docker Desktop ≥ 24
- 8 GB RAM (face model download ~500 MB)

### 1. Clone & configure

```bash
git clone https://github.com/yourorg/facesearch
cd facesearch
cp .env.example .env
# Edit .env — set strong secrets for JWT_SECRET, POSTGRES_PASSWORD, etc.
```

### 2. Start all services

```bash
docker-compose up -d
# First run downloads the InsightFace buffalo_l model (~500 MB)
```

### 3. Verify health

```bash
curl http://localhost:3000/health       # API Gateway
curl http://localhost:8000/health       # Face Service
```

### 4. Seed demo data

```bash
pip install httpx
python scripts/seed.py
```

### 5. Open the UI

```
http://localhost:3001
```

---

## API Reference

### Auth

| Method | Path              | Description        |
|--------|-------------------|--------------------|
| POST   | /auth/register    | Register new user  |
| POST   | /auth/login       | Login, get JWT     |

### Images

| Method | Path              | Description                |
|--------|-------------------|----------------------------|
| POST   | /images/upload    | Upload image(s)            |
| GET    | /images           | List images (paginated)    |
| GET    | /images/:id       | Image detail + face count  |
| DELETE | /images/:id       | Delete image + embeddings  |

### Search

| Method | Path              | Description                         |
|--------|-------------------|-------------------------------------|
| POST   | /search           | Search by face (returns top-K)      |
| GET    | /search/history   | Paginated search history            |

### Faces

| Method | Path              | Description                |
|--------|-------------------|----------------------------|
| GET    | /faces            | List detected faces        |
| GET    | /faces/:id        | Face detail                |

---

## Database Design

### PostgreSQL (relational metadata)

- **users** — accounts with tenant isolation
- **images** — upload records with processing status
- **faces** — per-face bounding boxes and landmarks
- **search_logs** — audit trail for queries

### pgvector (ANN search)

- **face_embeddings** — 512-dim ArcFace vectors
- **HNSW index** — `m=16, ef_construction=64` — sub-millisecond ANN at scale

---

## Scalability

| Concern          | Solution                                             |
|------------------|------------------------------------------------------|
| 10M+ images      | HNSW index scales to billions with proper ef setting |
| Query latency    | pgvector HNSW + Redis cache → P95 < 300ms           |
| Ingestion load   | Kafka consumer groups — add worker replicas          |
| GPU acceleration | Face service auto-detects CUDA                       |
| Multi-tenant     | tenant_id on every table + pgvector filtered search  |

---

## Security

- Passwords hashed with bcrypt (cost=12)
- JWT RS256 or HS256 (configurable)
- Signed MinIO URLs (15-min expiry)
- Embeddings never exposed in API responses
- Tenant isolation enforced at query level
- Input validation via class-validator (NestJS)
- Rate limiting via `@nestjs/throttler`

---

## License

MIT
