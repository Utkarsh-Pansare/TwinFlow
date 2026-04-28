# 🚀 TwinFlow Logistics Analytics Backend API

A production-ready, enterprise-grade backend for the TwinFlow logistics analytics platform. Built with TypeScript, Express.js, PostgreSQL, Prisma ORM, and Redis caching.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Database Setup](#database-setup)
- [Caching Strategy](#caching-strategy)
- [Docker Deployment](#docker-deployment)
- [Development Guide](#development-guide)
- [Production Deployment](#production-deployment)

---

## ✨ Features

- ✅ **9 Core API Endpoints** - All dashboard features supported
- ✅ **Clean Modular Architecture** - Services → Repositories → Controllers
- ✅ **PostgreSQL + Prisma** - Type-safe database access
- ✅ **Redis Caching** - High-performance data retrieval
- ✅ **Zod Validation** - Runtime type safety
- ✅ **10,000+ Seeded Shipments** - Realistic demo data
- ✅ **Comprehensive Error Handling** - Global middleware
- ✅ **Docker Ready** - Development & Production configs
- ✅ **Modular Routes** - Feature-based organization
- ✅ **Health Checks** - Service monitoring

---

## 🛠️ Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 20+ |
| Language | TypeScript | 5.5+ |
| Framework | Express.js | 4.19+ |
| Database | PostgreSQL | 16+ |
| ORM | Prisma | 6.0+ |
| Cache | Redis | 7+ |
| Validation | Zod | 3.23+ |
| Server | ESM | Latest |

---

## 📦 Prerequisites

- **Node.js** 18+ or 20+ (recommended: 20 LTS)
- **PostgreSQL** 14+ running locally or remote
- **Redis** 7+ running locally or remote
- **npm** 9+ or **yarn** 4+

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/twinflow_analytics"
REDIS_URL="redis://localhost:6379"
CORS_ORIGIN="http://localhost:5173"
```

### 3. Setup Database

```bash
# Create migrations
npm run prisma:migrate

# Seed with 10,000 shipments
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs at: **http://localhost:3000**
Health check: **http://localhost:3000/health**

### 5. (Optional) Run with Docker

```bash
# Build image
npm run docker:build

# Start with Docker Compose
docker-compose -f docker-compose.dev.yml up
```

---

## 🏗️ Architecture

### Directory Structure

```
backend/
├── src/
│   ├── index.ts                 # Main server file
│   ├── lib/
│   │   ├── prisma.ts            # Prisma client
│   │   └── redis.ts             # Redis client
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   ├── logger.ts
│   │   └── notFoundHandler.ts
│   ├── repositories/            # Data access layer
│   │   ├── ShipmentRepository.ts
│   │   ├── AlertRepository.ts
│   │   ├── DemurrageRepository.ts
│   │   └── MilestoneRepository.ts
│   ├── services/                # Business logic
│   │   ├── ShipmentService.ts
│   │   ├── AnalyticsService.ts
│   │   ├── MapService.ts
│   │   ├── AlertService.ts
│   │   └── KPIService.ts
│   ├── routes/                  # API endpoints
│   │   ├── shipments.ts
│   │   ├── analytics.ts
│   │   ├── map.ts
│   │   ├── alerts.ts
│   │   └── kpi.ts
│   ├── scripts/
│   │   └── seed.ts             # Database seeding
│   ├── types/                   # TypeScript types
│   └── config/                  # Configuration
├── prisma/
│   └── schema.prisma           # Database schema
├── Dockerfile                   # Docker image
├── docker-compose.dev.yml      # Dev environment
├── docker-compose.prod.yml     # Production environment
├── tsconfig.json               # TypeScript config
└── package.json
```

### Data Flow

```
Request
  ↓
Router (routes/*)
  ↓
Controller Logic
  ↓
Service Layer (services/*)
  ↓
Repository Layer (repositories/*)
  ↓
Prisma/Redis
  ↓
Response
```

### Key Principles

- **Controllers** handle HTTP requests/responses only
- **Services** contain business logic
- **Repositories** handle data access
- **No database logic in controllers**
- **All inputs validated with Zod**
- **Responses cached in Redis**

---

## 📡 API Endpoints

### 1️⃣ Shipments Overview

```
GET /api/shipments/overview

Response:
{
  "status": "success",
  "data": {
    "total": 168974,
    "breakdown": {
      "early": 33794,
      "onTime": 73589,
      "late": 50692,
      "unknown": 10879
    }
  }
}
```

### 2️⃣ Map Visualization

```
GET /api/map/shipments

Response:
{
  "status": "success",
  "data": [
    {
      "lat": 51.5074,
      "lng": -0.1278,
      "location": "London, UK",
      "count": 1234,
      "statusBreakdown": {
        "early": 245,
        "onTime": 532,
        "late": 398,
        "unknown": 59
      }
    }
    ...
  ]
}
```

### 3️⃣ Alerts/Disruptions

```
GET /api/alerts

POST /api/alerts
Body: { "title", "description", "severity" }

POST /api/alerts/disruption
(Creates Red Sea incident example)

PATCH /api/alerts/:id/resolve
```

### 4️⃣ KPI Metrics

```
GET /api/kpi/shipments
{
  "oceanLateDeparture": 402,
  "oceanLateDischarge": 856,
  "oceanEtaLate": 546,
  "truckloadEtaLate": 1126,
  "truckloadEtaEarly": 604
}

GET /api/kpi/efficiency
GET /api/kpi/on-time-performance
```

### 5️⃣ Analytics

```
GET /api/analytics/demurrage
GET /api/analytics/milestones
GET /api/analytics/predictions
GET /api/analytics/latency
```

### 6️⃣ Search Shipments

```
GET /api/shipments/search?q=SHP-123456

GET /api/shipments?status=LATE&mode=OCEAN&limit=50
```

---

## 🗄️ Database Setup

### Schema Overview

```prisma
model Shipment {
  id              String   @id
  referenceNo     String   @unique
  origin          String
  destination     String
  status          ShipmentStatus
  mode            TransportMode
  eta             DateTime
  actualArrival   DateTime?
  
  // Relations
  milestones      Milestone[]
  demurrage       Demurrage[]
  alerts          Alert[]
}

model Milestone {
  id              String
  shipmentId      String
  type            MilestoneType  # DEPART_ORIGIN, ARRIVE_TS, etc
  completed       Boolean
  timestamp       DateTime?
}

model Demurrage {
  id              String
  shipmentId      String
  period          DemurragePeriod  # FREE, FIRST, SECOND, THIRD
  containerCount  Int
  totalCost       Float
}

model Alert {
  id              String
  shipmentId      String?
  title           String
  description     String
  severity        AlertSeverity    # LOW, MEDIUM, HIGH, CRITICAL
  isResolved      Boolean
}
```

### Migrations

```bash
# Create new migration
prisma migrate dev --name add_new_field

# Push to database
prisma migrate deploy

# Reset database (careful!)
prisma migrate reset --force
```

---

## ⚡ Caching Strategy

### Redis Cache Layers

| Endpoint | Cache Key | TTL | Invalidation |
|----------|-----------|-----|--------------|
| `/shipments/overview` | `shipment:overview` | 300s | On status change |
| `/map/shipments` | `map:shipments` | 600s | Every 10 mins |
| `/analytics/demurrage` | `analytics:demurrage` | 300s | On update |
| `/analytics/milestones` | `analytics:milestones` | 300s | On completion |
| `/kpi/shipments` | `kpi:shipments` | 300s | On alert/status |
| `/alerts` | `alerts:trending` | 60s | On new alert |

### Cache Invalidation

```typescript
// When shipment status changes
await redis.del(getCacheKey('shipment', 'overview'));
await redis.del(getCacheKey('kpi', 'shipments'));

// When alert is created
await redis.del(getCacheKey('alerts', 'trending'));
```

---

## 🐳 Docker Deployment

### Development Stack

```bash
# Start dev environment
docker-compose -f docker-compose.dev.yml up

# Includes:
# - PostgreSQL on port 5432
# - Redis on port 6379
# - API on port 3000
# - Hot-reload enabled
```

### Production Stack

```bash
# Build image
docker build -t twinflow-api:latest .

# Start production environment
docker-compose -f docker-compose.prod.yml up

# Notes:
# - Health checks enabled
# - Non-root user (nodejs)
# - Restart policies set
# - Volumes for persistence
```

### Environment Variables (Production)

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
POSTGRES_PASSWORD=secure-password
REDIS_PASSWORD=secure-password
```

---

## 🛠️ Development Guide

### Running Locally (Without Docker)

```bash
# Prerequisites: PostgreSQL & Redis running locally

# Install dependencies
npm install

# Setup database
npm run prisma:migrate
npm run db:seed

# Start dev server with hot-reload
npm run dev

# Terminal 1: Start server
# Terminal 2: Database changes
npm run prisma:studio

# Terminal 3: Monitor logs
npm run lint
```

### Creating New Endpoints

1. **Create Repository** (if new entity)
   ```typescript
   // src/repositories/NewRepository.ts
   export class NewRepository {
     async findAll() { ... }
   }
   ```

2. **Create Service** (business logic)
   ```typescript
   // src/services/NewService.ts
   export class NewService {
     async getData() {
       // Use repository + Redis
     }
   }
   ```

3. **Create Routes**
   ```typescript
   // src/routes/new.ts
   router.get('/', async (req, res, next) => {
     const data = await newService.getData();
     res.json({ status: 'success', data });
   });
   ```

4. **Register in index.ts**
   ```typescript
   import newRoutes from './routes/new';
   app.use(`${API_PREFIX}/new`, newRoutes);
   ```

### Testing

```bash
# Check types
npm run type-check

# Lint code
npm run lint

# Build
npm run build
```

---

## 🚢 Production Deployment

### Option 1: Docker on Cloud Run (GCP)

```bash
# Build and push image
gcloud builds submit --tag gcr.io/YOUR_PROJECT/twinflow-api

# Deploy
gcloud run deploy twinflow-api \
  --image gcr.io/YOUR_PROJECT/twinflow-api \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=$DB_URL,REDIS_URL=$REDIS_URL
```

### Option 2: Docker on AWS ECS

```bash
# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login ...
docker tag twinflow-api:latest <account>.dkr.ecr.us-east-1.amazonaws.com/twinflow-api
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/twinflow-api

# Deploy with ECS/Fargate
```

### Option 3: Traditional VPS

```bash
# On VPS
git clone <repo>
cd backend
npm ci --only=production
npm run prisma:migrate

# Run with PM2
pm2 start dist/src/index.js --name twinflow-api
pm2 save
```

### Database Backups

```bash
# PostgreSQL backup
pg_dump -h <host> -U postgres twinflow_analytics > backup.sql

# Restore
psql -h <host> -U postgres < backup.sql
```

---

## 📊 Seed Data

The seed script creates:

- **10,000 shipments** - Realistic distribution across 12 global cities
- **40,000 milestones** - 4 per shipment with 70% completion
- **3,000 demurrage records** - Cost breakdowns by period
- **50 alerts** - Various severity levels

To reseed:

```bash
npm run db:reset  # ⚠️ Deletes all data
npm run db:seed   # Repopulate with fresh data
```

---

## 🔍 Monitoring & Logs

### Health Check Endpoint

```bash
curl http://localhost:3000/health

# Response:
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "database": "connected",
  "redis": "connected"
}
```

### View Database

```bash
# Open Prisma Studio
npx prisma studio

# Browser: http://localhost:5555
```

### Query Examples

```bash
# Get all Ocean shipments
curl "http://localhost:3000/api/shipments?mode=OCEAN"

# Search by reference
curl "http://localhost:3000/api/shipments/search?q=SHP-123"

# Get high-severity alerts
curl "http://localhost:3000/api/alerts"

# Get efficiency score
curl "http://localhost:3000/api/kpi/efficiency"
```

---

## 🐛 Troubleshooting

### Issue: Connection Refused

```bash
# Check PostgreSQL
psql -U postgres -d postgres -c "SELECT version();"

# Check Redis
redis-cli ping

# Fix: Start services
brew services start postgresql
brew services start redis
```

### Issue: Prisma Client Not Found

```bash
npm run prisma:generate
npm run build
```

### Issue: Database Migration Fails

```bash
# Reset migrations (careful!)
prisma migrate reset --force

# Or push schema without migrations
prisma db push
```

### Issue: Redis Connection Timeout

```bash
# Check Redis
redis-cli ping

# Clear cache
redis-cli FLUSHALL

# Restart
redis-cli SHUTDOWN
redis-server
```

---

## 📝 API Response Format

### Success Response

```json
{
  "status": "success",
  "data": { ... },
  "count": 100
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Detailed error message",
  "errors": [ ... ]
}
```

### Pagination

```bash
GET /api/shipments?limit=50&offset=0
```

---

## 🔐 Security Considerations

- ✅ Environment variables for sensitive data
- ✅ Non-root Docker user
- ✅ CORS configuration
- ✅ Input validation with Zod
- ✅ Error messages don't leak internals
- ✅ SQL injection prevention (Prisma)
- ⚠️ Add authentication/authorization as needed
- ⚠️ Rate limiting recommended for production

---

## 📚 Additional Resources

- [Prisma Docs](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 📞 Support

For issues or questions:

1. Check logs: `npm run dev`
2. Check health: `curl http://localhost:3000/health`
3. Review error messages
4. Consult troubleshooting section above

---

## ✅ Ready for Production

This backend is:
- ✅ Fully functional
- ✅ Well-documented
- ✅ Type-safe
- ✅ Properly cached
- ✅ Docker-ready
- ✅ Scalable
- ✅ Maintainable

**Build status**: ✅ **PRODUCTION READY**

---

**Last Updated**: April 2024
**Version**: 1.0.0
**License**: MIT
