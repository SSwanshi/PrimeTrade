# PrimeTrade

PrimeTrade is a full-stack trading platform that lets users buy and sell assets, manage a portfolio, and track holdings. Administrators can manage users, assets, and orders through a dedicated admin panel.

The project is built with **React**, **Express**, **PostgreSQL**, **Prisma ORM**, and **Upstash Redis**, and is fully containerized with **Docker**.

---

## Features

### User (Trader)
- Register and log in with JWT authentication
- View portfolio balance on a personal dashboard
- Browse tradable assets (stocks and crypto)
- Place instant buy/sell orders
- **My Holdings** — view owned stocks with quantity, price, and market value
- Edit holding quantities directly from the holdings panel
- View transaction history and cancel orders

### Administrator
- Create, update, and delete tradable assets
- View and manage all registered users
- View all orders across the platform

### Platform
- OpenAPI 3.0 documentation via Swagger UI
- Redis-backed dashboard caching for faster load times
- Docker Compose setup for one-command deployment
- Role-based access control (`USER` / `ADMIN`)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma 5 |
| Caching | Upstash Redis (REST) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| API Docs | Swagger UI (swagger-ui-express) |
| Containerization | Docker, Docker Compose, Nginx |

---

## Project Structure

```
PrimeTrade/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   ├── seed.js             # Demo data seeder
│   │   └── migrations/         # Version-controlled DB migrations
│   ├── src/
│   │   ├── routes/             # API route handlers
│   │   ├── cache/              # Redis dashboard caching
│   │   ├── middleware/         # JWT auth & admin guards
│   │   ├── swagger.ts          # OpenAPI specification
│   │   └── index.ts            # Express app entry point
│   ├── public/                 # Swagger custom scripts
│   ├── Dockerfile
│   └── docker-entrypoint.sh    # Migrations + seed on container start
├── frontend/
│   ├── src/
│   │   └── App.tsx             # Main app (auth, dashboard, admin)
│   ├── nginx.conf              # Reverse proxy for production Docker
│   └── Dockerfile
├── docker-compose.yml          # Multi-service orchestration
└── .env.example                # Environment variable template
```

---

## Database & Prisma ORM

PrimeTrade uses **PostgreSQL** as its primary database, managed through **Prisma ORM**. Prisma provides type-safe database access, schema migrations, and a seeding workflow.

### Schema Overview

| Model | Description |
|-------|-------------|
| `User` | Registered users with email, hashed password, name, and role |
| `Portfolio` | One-to-one with User — stores cash balance for trading |
| `Asset` | Tradable instruments (symbol, name, price, type) |
| `Order` | Buy/sell records with quantity, price, and status |

### Enums

- **Role:** `USER`, `ADMIN`
- **OrderSide:** `BUY`, `SELL`
- **OrderStatus:** `PENDING`, `FILLED`, `CANCELLED`

### Prisma Commands

Run these from the `backend/` directory:

```bash
# Apply migrations to the database
npx prisma migrate deploy

# Create a new migration after schema changes (development)
npx prisma migrate dev --name your_migration_name

# Open Prisma Studio (visual DB browser)
npx prisma studio

# Regenerate the Prisma client after schema changes
npx prisma generate
```

### Migrations

Database schema changes are tracked in `backend/prisma/migrations/`. On Docker startup, `prisma migrate deploy` runs automatically via `docker-entrypoint.sh` to ensure the database is always up to date.

---

## Database Seeding

The seed script (`backend/prisma/seed.js`) populates the database with demo data for development and testing. It is **idempotent** — safe to run multiple times without creating duplicate records.

### What Gets Seeded

| Data | Details |
|------|---------|
| Demo users | `user@primetrade.com` (USER) and `admin@primetrade.com` (ADMIN) |
| Portfolios | $10,000 starting balance for demo accounts |
| Assets | BTC, ETH, AAPL, TSLA with sample prices |
| Orders | Sample buy/sell/pending/cancelled orders for the demo user |

### Run Seed Manually

```bash
cd backend
npx prisma db seed
```

In Docker, seeding runs automatically after migrations on every container start.

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| User (Trader) | `user@primetrade.com` | `password123` |
| Administrator | `admin@primetrade.com` | `password123` |

New users registered via the app receive a **$10,000** starting portfolio balance.

---

## Redis Caching

Dashboard data is cached in **Upstash Redis** to reduce database load and improve response times.

- **Endpoint:** `GET /api/dashboard` — returns portfolio, assets, and orders in a single request
- **Cache key:** `dashboard:{userId}` (per-user)
- **TTL:** Configurable via `DASHBOARD_CACHE_TTL_SECONDS` (default: 60 seconds)
- **Response headers:** `X-Cache: HIT` or `MISS`
- **Invalidation:** Cache is cleared when a user places/updates/cancels an order, or when an admin modifies assets
- **Fallback:** If Redis is unavailable, the API falls back to PostgreSQL transparently

---

## API Documentation

Interactive API docs are available via Swagger UI.

| URL (local) |
----------------------|
| http://localhost:8000/api-docs | 

OpenAPI JSON spec: `GET /api-docs.json`

### API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/dashboard` | User | Cached dashboard data |
| GET | `/api/portfolio` | User | Portfolio balance |
| GET | `/api/assets` | User | List all assets |
| POST | `/api/assets` | Admin | Create asset |
| PUT | `/api/assets/:id` | Admin | Update asset price |
| DELETE | `/api/assets/:id` | Admin | Delete asset |
| POST | `/api/orders` | User | Place buy/sell order |
| GET | `/api/orders/my-orders` | User | User's orders |
| PUT | `/api/orders/:id` | User | Update order quantity |
| DELETE | `/api/orders/:id` | User | Cancel order |
| GET | `/api/orders` | Admin | All orders |
| GET | `/api/users` | Admin | List users |
| PUT | `/api/users/:id` | Admin | Update user |
| DELETE | `/api/users/:id` | Admin | Delete user |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [PostgreSQL](https://www.postgresql.org/) 16+ (for local development)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for containerized setup)
- [Upstash Redis](https://upstash.com/) account (optional, for caching)

---

### Option 1 — Docker (Recommended)

The fastest way to run the entire stack.

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PrimeTrade
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Upstash Redis credentials (optional).

3. **Start all services**
   ```bash
   docker compose up --build
   ```

4. **Open the application**

   | Service | URL |
   |---------|-----|
   | Frontend | http://localhost:3000 |
   | Backend API | http://localhost:8000/api |
   | Swagger Docs | http://localhost:3000/api-docs |
   | PostgreSQL | localhost:5432 |

5. **Stop services**
   ```bash
   docker compose down        # Stop containers
   docker compose down -v       # Stop and remove database volume
   ```

Docker Compose starts three services:

| Service | Container | Port |
|---------|-----------|------|
| PostgreSQL | `primetrade-db` | 5432 |
| Backend API | `primetrade-backend` | 8000 |
| Frontend (Nginx) | `primetrade-frontend` | 3000 |

On startup, the backend automatically runs database migrations and seeds demo data.

---

### Option 2 — Local Development

#### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, and Upstash credentials

npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Backend runs at **http://localhost:8000**

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173** (Vite default).

Set `VITE_API_URL` in a frontend `.env` file if your backend is not at `http://localhost:8000/api`:
```
VITE_API_URL=http://localhost:8000/api
```

---

## Environment Variables

### Root `.env` (Docker Compose)

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | PostgreSQL username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `primetrade` |
| `POSTGRES_DB` | Database name | `primetrade` |
| `POSTGRES_PORT` | Host port for PostgreSQL | `5432` |
| `FRONTEND_PORT` | Host port for frontend | `3000` |
| `BACKEND_PORT` | Host port for backend | `8000` |
| `JWT_SECRET` | Secret key for JWT signing | — |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | — |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | — |
| `DASHBOARD_CACHE_TTL_SECONDS` | Dashboard cache TTL | `60` |

### Backend `.env` (Local Development)

| Variable | Description |
|----------|-------------|
| `PORT` | API server port |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `DASHBOARD_CACHE_TTL_SECONDS` | Dashboard cache TTL in seconds |

---

## Scalability & Deployment Readiness

PrimeTrade is designed with scalability in mind.

### Stateless Authentication

The application uses JWT-based authentication, making backend instances stateless. This enables horizontal scaling by running multiple API instances behind a load balancer without requiring session sharing.

### Dockerized Infrastructure

Both the backend and supporting services are containerized using Docker, ensuring consistent deployments across development and production environments.

### Redis Caching

Redis is used to cache frequently accessed data such as asset information, reducing database load and improving API response times.

### Database Layer

PostgreSQL serves as the primary database. As traffic grows, read replicas and connection pooling can be introduced to improve performance and availability.

### Load Balancing Strategy

The application can be scaled horizontally by deploying multiple backend instances behind Nginx, HAProxy, or a cloud load balancer. Incoming requests would be distributed across instances while all services share the same PostgreSQL and Redis infrastructure.

### Future Enhancements

* Nginx-based load balancing
* PostgreSQL read replicas
* Kubernetes orchestration
* Separate microservices for Authentication, Trading, and Portfolio modules
* Distributed caching and monitoring




