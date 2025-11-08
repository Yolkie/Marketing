# 🐳 Docker Quick Start

## Prerequisites
- Docker & Docker Compose installed
- Ports 80, 3001, 5432 available

## Quick Start

1. **Create `.env` file:**
```env
DB_PASSWORD=your_secure_password
JWT_SECRET=$(openssl rand -base64 32)
VITE_API_URL=http://localhost:3001/api
```

2. **Start services:**
```bash
docker-compose up -d
```

3. **Access application:**
- Frontend: http://localhost
- Backend API: http://localhost:3001/api
- Health Check: http://localhost:3001/api/health

## Development Mode

```bash
docker-compose -f docker-compose.dev.yml up
```

## Production Mode

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Common Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild
docker-compose up -d --build

# Database backup
docker-compose exec postgres pg_dump -U postgres marketing_dashboard > backup.sql
```

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for complete documentation.

