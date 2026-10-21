# Multi-Vendor E-Commerce Marketplace (FS-01)

## Quick start
```bash
docker compose up -d                 # MongoDB, Redis, Elasticsearch
cd backend
cp .env.example .env
npm install
npm run dev                          # http://localhost:5000/health
npm test                             # API tests + coverage
npm run create-admin -- admin@example.com StrongPass123 "Admin"
```

## Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev                          # http://localhost:5173 (proxies /api to :5000)
```
Run the backend and frontend in two terminals.

## Environment
Copy `backend/.env.example` to `backend/.env`. Image upload needs AWS values: see `docs/s3-setup.md`.
