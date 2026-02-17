.PHONY: dev-up dev-down dev-frontend dev-backend dev-worker dev-all db-migrate db-seed db-studio clean setup alembic-migrate

# Docker services
dev-up:
	docker compose -f docker/docker-compose.yml up -d

dev-down:
	docker compose -f docker/docker-compose.yml down

dev-reset:
	docker compose -f docker/docker-compose.yml down -v
	docker compose -f docker/docker-compose.yml up -d

# Setup
setup:
	cd frontend && npm install
	cd backend && python -m venv .venv && source .venv/bin/activate && pip install poetry && poetry install

# Frontend
dev-frontend:
	cd frontend && npm run dev

# Backend
dev-backend:
	cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

dev-worker:
	cd backend && source .venv/bin/activate && celery -A app.workers.celery_app worker --loglevel=info

# Run all (use separate terminals)
dev-all:
	@echo "Run these in separate terminals:"
	@echo "  make dev-up        # Start Docker services"
	@echo "  make dev-frontend  # Start Next.js on :3000"
	@echo "  make dev-backend   # Start FastAPI on :8000"
	@echo "  make dev-worker    # Start Celery worker"

# Database
db-migrate:
	cd frontend && npx prisma migrate dev

db-seed:
	cd frontend && npx prisma db seed

db-studio:
	cd frontend && npx prisma studio

db-generate:
	cd frontend && npx prisma generate

# Backend migrations
alembic-migrate:
	cd backend && source .venv/bin/activate && alembic upgrade head

alembic-revision:
	cd backend && source .venv/bin/activate && alembic revision --autogenerate -m "$(msg)"

# Cleanup
clean:
	docker compose -f docker/docker-compose.yml down -v
	rm -rf frontend/node_modules frontend/.next
	rm -rf backend/.venv backend/__pycache__
