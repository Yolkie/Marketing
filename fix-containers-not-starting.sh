#!/bin/bash

# Fix script for containers that are created but not starting

set -e

echo "🔧 Fixing containers that won't start..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating .env file..."
    
    cat > .env << 'EOF'
# Database Configuration
DB_NAME=marketing_dashboard
DB_USER=postgres
DB_PASSWORD=changeme_password_123
DB_PORT=5432

# Backend Configuration
NODE_ENV=production
JWT_SECRET=changeme_jwt_secret_123
JWT_EXPIRES_IN=7d

# Frontend Configuration
VITE_API_URL=http://localhost:3001/api

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:80

# Port Configuration
FRONTEND_PORT=80
BACKEND_PORT=3001
EOF
    
    echo "⚠️  Created .env file with default values. Please edit it with your actual values!"
    echo "   nano .env"
    read -p "Press Enter after reviewing/editing .env file..."
fi

# Stop and remove existing containers
echo ""
echo "🛑 Stopping and removing existing containers..."
docker compose down -v

# Check for port conflicts
echo ""
echo "🔍 Checking for port conflicts..."
if command -v netstat &> /dev/null; then
    echo "Port 80:"
    sudo netstat -tulpn | grep :80 || echo "  ✅ Port 80 is available"
    echo "Port 3001:"
    sudo netstat -tulpn | grep :3001 || echo "  ✅ Port 3001 is available"
    echo "Port 5432:"
    sudo netstat -tulpn | grep :5432 || echo "  ✅ Port 5432 is available"
fi

# Remove old images to force rebuild
echo ""
echo "🗑️  Removing old images..."
docker rmi marketing-dashboard-frontend marketing-dashboard-backend 2>/dev/null || true

# Build images
echo ""
echo "🔨 Building images..."
docker compose build --no-cache

# Start services
echo ""
echo "🚀 Starting services..."
docker compose up -d

# Wait a bit
echo ""
echo "⏳ Waiting for services to initialize..."
sleep 15

# Check status
echo ""
echo "📊 Container Status:"
docker compose ps

# Show logs
echo ""
echo "📝 Recent Logs:"
echo "--- Database Logs ---"
docker compose logs --tail=20 postgres
echo ""
echo "--- Backend Logs ---"
docker compose logs --tail=20 backend
echo ""
echo "--- Frontend Logs ---"
docker compose logs --tail=20 frontend

# Check if ports are exposed
echo ""
echo "🌐 Port Mappings:"
docker compose ps --format json 2>/dev/null | grep -i port || docker ps --format "table {{.Names}}\t{{.Ports}}" | grep marketing

echo ""
echo "✅ Done! Check the logs above for any errors."
echo ""
echo "💡 If containers are still not running:"
echo "   1. Check logs: docker compose logs -f"
echo "   2. Check .env file has all required variables"
echo "   3. Check for port conflicts"
echo "   4. Verify Docker has enough resources"

