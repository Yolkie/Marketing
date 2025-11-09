#!/bin/bash

# Quick fix script for Node.js version issues in Docker

echo "🔧 Fixing Docker Node.js version issue..."
echo ""

# Stop and remove existing containers
echo "1. Stopping existing containers..."
docker-compose down -v 2>/dev/null || true

# Remove old images
echo "2. Removing old images..."
docker rmi marketing-dashboard-frontend marketing-dashboard-backend 2>/dev/null || true

# Clean up any orphaned containers
echo "3. Cleaning up..."
docker system prune -f

# Rebuild with no cache
echo "4. Rebuilding images with Node.js 18..."
docker-compose build --no-cache

# Start services
echo "5. Starting services..."
docker-compose up -d

# Wait a moment for services to start
echo "6. Waiting for services to initialize..."
sleep 5

# Verify Node.js versions
echo ""
echo "7. Verifying Node.js versions:"
echo "   Frontend: $(docker-compose exec -T frontend node --version 2>/dev/null || echo 'Not ready yet')"
echo "   Backend:  $(docker-compose exec -T backend node --version 2>/dev/null || echo 'Not ready yet')"

echo ""
echo "✅ Done! Check status with: docker-compose ps"
echo "📋 View logs with: docker-compose logs -f"

