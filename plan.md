You are a Staff-level Software Engineer (FAANG-level) tasked to design and implement a production-grade Face Recognition Search System similar to Apple Photos / Google Photos.

Your goal is to generate a COMPLETE, SCALABLE, and CLEAN architecture + repository.

---

# 🗂️ IMPLEMENTATION PHASES

> Execute **one phase at a time**. Say `phase N` to start each phase.

| # | Phase | Files Created | Status |
|---|-------|---------------|--------|
| **1** | Root & Infrastructure config | `docker-compose.yml`, `.env.example`, `package.json`, `infrastructure/docker/nginx.conf`, `infrastructure/docker/postgres/init.sql` | ⬜ Not started |
| **2** | API Gateway (NestJS) | Full NestJS app — `src/main.ts`, auth module, images module, search module, entities, kafka service, storage service, guards, DTOs, `Dockerfile` | ⬜ Not started |
| **3** | Face Service (FastAPI / AI) | Python FastAPI — InsightFace detection + ArcFace 512-dim embedding, pgvector writes, `Dockerfile`, `requirements.txt` | ⬜ Not started |
| **4** | Worker (Kafka consumer) | Python async worker — consumes `image.uploaded` topic, calls face service, stores embeddings, `Dockerfile` | ⬜ Not started |
| **5** | Web Frontend (Next.js) | Next.js 14 App Router — upload page, search page, `ImageUploader`, `SearchResults`, API client, `Dockerfile` | ⬜ Not started |
| **6** | Shared packages | `packages/shared-types` (TypeScript types), `packages/config` (env helpers) | ⬜ Not started |
| **7** | Infrastructure — K8s + Terraform | Kubernetes manifests (deployments, services, ingress, configmaps), Terraform IaC for cloud | ⬜ Not started |
| **8** | Scripts & seeds | `scripts/seed.py` — demo data, `scripts/test-upload.sh` — smoke test | ⬜ Not started |

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
