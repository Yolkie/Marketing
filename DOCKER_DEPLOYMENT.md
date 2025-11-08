# Docker Deployment Guide

This guide explains how to deploy the Marketing Dashboard using Docker and Docker Compose.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM available
- Ports 80, 3001, and 5432 available (or configure custom ports)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Marketing-Dashboard
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
DB_NAME=marketing_dashboard
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_PORT=5432

# Backend Configuration
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Frontend Configuration
VITE_API_URL=http://localhost:3001/api
# OR for production with domain:
# VITE_API_URL=https://your-domain.com/api

# Webhook Configuration (Optional)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
WEBHOOK_SECRET=your-webhook-secret

# CORS Configuration
ALLOWED_ORIGINS=https://your-n8n-server.com,http://localhost:3000

# Port Configuration (Optional - defaults shown)
FRONTEND_PORT=80
BACKEND_PORT=3001
```

**⚠️ Important**: 
- Change `DB_PASSWORD` to a strong password
- Change `JWT_SECRET` to a random secret (use: `openssl rand -base64 32`)
- Never commit `.env` file to version control

### 3. Build and Start Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 4. Verify Deployment

```bash
# Check backend health
curl http://localhost:3001/api/health

# Check frontend
curl http://localhost

# Check database connection
docker-compose exec postgres psql -U postgres -d marketing_dashboard -c "SELECT version();"
```

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │  Port 80
│   (nginx)       │
└────────┬────────┘
         │
         │ /api
         ▼
┌─────────────────┐
│   Backend       │  Port 3001
│   (Node.js)     │
└────────┬────────┘
         │
         │ PostgreSQL
         ▼
┌─────────────────┐
│   PostgreSQL    │  Port 5432 (internal)
│   Database      │
└─────────────────┘
```

## 📦 Services

### Frontend Service
- **Image**: Built from `Dockerfile` (multi-stage: Node.js build + nginx serve)
- **Port**: 80 (configurable via `FRONTEND_PORT`)
- **Network**: `marketing-network`
- **Dependencies**: Backend service

### Backend Service
- **Image**: Built from `server/Dockerfile`
- **Port**: 3001 (configurable via `BACKEND_PORT`)
- **Network**: `marketing-network`
- **Dependencies**: PostgreSQL service
- **Health Check**: `/api/health` endpoint

### PostgreSQL Service
- **Image**: `postgres:15-alpine`
- **Port**: 5432 (internal only in production)
- **Network**: `marketing-network`
- **Volumes**: `postgres_data` (persistent storage)
- **Initialization**: Automatically runs schema SQL files

## 🔧 Configuration

### Environment Variables

All environment variables are read from the `.env` file in the project root.

**Required Variables:**
- `DB_PASSWORD` - PostgreSQL password
- `JWT_SECRET` - JWT signing secret

**Optional Variables:**
- `DB_NAME` - Database name (default: `marketing_dashboard`)
- `DB_USER` - Database user (default: `postgres`)
- `NODE_ENV` - Environment (default: `production`)
- `VITE_API_URL` - Frontend API URL
- `ALLOWED_ORIGINS` - CORS allowed origins

### Port Configuration

Change ports by setting environment variables:

```env
FRONTEND_PORT=8080
BACKEND_PORT=3002
DB_PORT=5433
```

Then update `docker-compose.yml` or use:

```bash
FRONTEND_PORT=8080 BACKEND_PORT=3002 docker-compose up -d
```

### Network Configuration

All services are on the `marketing-network` bridge network. Services can communicate using service names:
- Frontend → Backend: `http://backend:3001`
- Backend → Database: `postgres:5432`

## 🛠️ Common Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restart Services
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart backend
```

### Rebuild Services
```bash
# Rebuild all
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild and restart
docker-compose up -d --build
```

### Access Container Shell
```bash
# Backend
docker-compose exec backend sh

# Database
docker-compose exec postgres psql -U postgres -d marketing_dashboard
```

### Database Operations
```bash
# Run SQL file
docker-compose exec -T postgres psql -U postgres -d marketing_dashboard < server/database/complete_schema.sql

# Backup database
docker-compose exec postgres pg_dump -U postgres marketing_dashboard > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres -d marketing_dashboard < backup.sql
```

## 🔒 Production Deployment

### 1. Use Production Compose File

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Security Considerations

- **Change default passwords**: Update `DB_PASSWORD` and `JWT_SECRET`
- **Use HTTPS**: Configure reverse proxy (nginx/traefik) with SSL
- **Restrict database access**: Don't expose PostgreSQL port publicly
- **Use secrets management**: Consider Docker secrets or external secret managers
- **Enable firewall**: Only expose necessary ports
- **Regular updates**: Keep Docker images updated

### 3. Reverse Proxy Setup (Recommended)

Use nginx or traefik as reverse proxy with SSL:

```nginx
# nginx.conf example
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. Environment-Specific Configuration

Create separate `.env` files:
- `.env.production` - Production settings
- `.env.staging` - Staging settings
- `.env.development` - Development settings

Use with:
```bash
docker-compose --env-file .env.production up -d
```

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check service status
docker-compose ps

# Verify environment variables
docker-compose config
```

### Database Connection Issues

```bash
# Check database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec backend node -e "console.log(process.env.DB_HOST)"
```

### Frontend Can't Reach Backend

1. Check network connectivity:
   ```bash
   docker-compose exec frontend ping backend
   ```

2. Verify API URL in frontend:
   ```bash
   docker-compose exec frontend env | grep VITE_API_URL
   ```

3. Check nginx configuration:
   ```bash
   docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
   ```

### Port Already in Use

```bash
# Find process using port
lsof -i :80
lsof -i :3001
lsof -i :5432

# Change ports in .env file
FRONTEND_PORT=8080
BACKEND_PORT=3002
```

### Out of Disk Space

```bash
# Clean up unused images
docker system prune -a

# Remove unused volumes
docker volume prune
```

### Database Data Persistence

Database data is stored in Docker volume `postgres_data`. To backup:

```bash
# Backup volume
docker run --rm -v marketing-dashboard_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data

# Restore volume
docker run --rm -v marketing-dashboard_postgres_data:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/postgres_backup.tar.gz"
```

## 📊 Monitoring

### Health Checks

All services have health checks configured:

```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost:3001/api/health
curl http://localhost/health
```

### Resource Usage

```bash
# View resource usage
docker stats

# View for specific services
docker stats marketing-dashboard-backend marketing-dashboard-frontend marketing-dashboard-db
```

## 🔄 Updates and Maintenance

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Or rebuild specific service
docker-compose build backend
docker-compose up -d backend
```

### Update Database Schema

```bash
# Run migration SQL
docker-compose exec -T postgres psql -U postgres -d marketing_dashboard < server/database/migration.sql
```

### Backup Before Updates

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres marketing_dashboard > backup_$(date +%Y%m%d).sql

# Backup volumes (optional)
docker run --rm -v marketing-dashboard_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/volume_backup_$(date +%Y%m%d).tar.gz /data
```

## 📝 Example Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash

set -e

echo "🚀 Deploying Marketing Dashboard..."

# Pull latest code
git pull

# Build and start services
docker-compose up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check health
curl -f http://localhost:3001/api/health || exit 1

echo "✅ Deployment complete!"
```

Make executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🎯 Next Steps

1. **Configure SSL**: Set up HTTPS with Let's Encrypt
2. **Set up monitoring**: Add monitoring tools (Prometheus, Grafana)
3. **Configure backups**: Set up automated database backups
4. **Set up CI/CD**: Automate deployments
5. **Scale services**: Use Docker Swarm or Kubernetes for scaling

---

**Last Updated**: 2024-01-01
**Docker Version**: 20.10+
**Docker Compose Version**: 2.0+

