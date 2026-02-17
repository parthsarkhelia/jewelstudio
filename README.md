# JewelStudio

Full-stack 3D jewelry showcase and processing platform. Upload, view, and share 3D jewelry models with real-time material editing, format conversion, and collaboration features.

## Tech Stack

- **Frontend**: Next.js 15, React 19, Three.js (React Three Fiber), shadcn/ui, Prisma, NextAuth v5
- **Backend**: FastAPI, SQLAlchemy, Celery + Redis, trimesh, MinIO S3
- **Infrastructure**: PostgreSQL 16, Redis 7, MinIO (S3-compatible storage)

## Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose

## Quick Start

```bash
# 1. Start infrastructure (PostgreSQL, Redis, MinIO)
make dev-up

# 2. Install dependencies
make setup

# 3. Run database migrations
make db-migrate

# 4. Start frontend (in one terminal)
make dev-frontend

# 5. Start backend (in another terminal)
make dev-backend

# 6. Start Celery worker (in another terminal)
make dev-worker
```

The frontend runs on http://localhost:3000 and the backend API on http://localhost:8000.

## Project Structure

```
jewelstudio/
├── frontend/          # Next.js application
│   ├── src/
│   │   ├── app/       # App router pages and API routes
│   │   ├── components/# React components (viewer, layout, ui)
│   │   ├── hooks/     # Custom React hooks
│   │   ├── lib/       # Auth, Prisma, utilities
│   │   └── types/     # TypeScript type definitions
│   └── prisma/        # Database schema and migrations
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── routers/   # API endpoints
│   │   ├── models/    # SQLAlchemy models
│   │   ├── services/  # Business logic (conversion, storage, thumbnails)
│   │   └── workers/   # Celery tasks
│   └── alembic/       # Database migrations
├── docker/            # Docker Compose for dev services
└── Makefile           # Development commands
```

## Available Commands

| Command | Description |
|---|---|
| `make dev-up` | Start Docker services (PostgreSQL, Redis, MinIO) |
| `make dev-down` | Stop Docker services |
| `make dev-frontend` | Start Next.js dev server on :3000 |
| `make dev-backend` | Start FastAPI dev server on :8000 |
| `make dev-worker` | Start Celery worker |
| `make setup` | Install all dependencies (frontend + backend) |
| `make db-migrate` | Run Prisma migrations |
| `make alembic-migrate` | Run Alembic migrations (backend) |
| `make db-seed` | Seed the database |
| `make db-studio` | Open Prisma Studio |
| `make clean` | Remove all build artifacts and volumes |
