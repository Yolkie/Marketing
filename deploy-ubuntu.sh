#!/bin/bash

# Marketing Dashboard - Ubuntu 22.04 Deployment Script
# This script automates the deployment process on Ubuntu

set -e  # Exit on error

echo "🚀 Marketing Dashboard - Ubuntu Deployment Script"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}❌ Please do not run as root. Run as your user (Docker will use sudo when needed).${NC}"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker is not installed.${NC}"
    echo "Installing Docker..."
    
    # Update package index
    sudo apt update
    
    # Install prerequisites
    sudo apt install -y ca-certificates curl gnupg lsb-release
    
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✅ Docker installed. Please log out and back in, or run 'newgrp docker'${NC}"
    echo "Then run this script again."
    exit 0
fi

# Check if user is in docker group
if ! groups | grep -q docker; then
    echo -e "${YELLOW}⚠️  User not in docker group. Adding...${NC}"
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✅ Added to docker group. Please run 'newgrp docker' or log out and back in.${NC}"
    echo "Then run this script again."
    exit 0
fi

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found.${NC}"
    echo "Creating .env file from template..."
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    
    cat > .env << EOF
# Database Configuration
DB_NAME=marketing_dashboard
DB_USER=postgres
DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-32)
DB_PORT=5432

# Backend Configuration
NODE_ENV=production
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# Frontend Configuration
VITE_API_URL=http://$(hostname -I | awk '{print $1}'):3001/api

# Webhook Configuration (Optional)
N8N_WEBHOOK_URL=
WEBHOOK_SECRET=

# CORS Configuration
ALLOWED_ORIGINS=http://$(hostname -I | awk '{print $1}')

# Port Configuration
FRONTEND_PORT=80
BACKEND_PORT=3001
EOF
    
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Please review and edit .env file before continuing:${NC}"
    echo "   nano .env"
    echo ""
    read -p "Press Enter after reviewing .env file..."
fi

# Stop existing containers
echo ""
echo "🛑 Stopping existing containers..."
docker compose down -v 2>/dev/null || true

# Remove old images
echo "🗑️  Removing old images..."
docker rmi marketing-dashboard-frontend marketing-dashboard-backend 2>/dev/null || true

# Build images
echo ""
echo "🔨 Building Docker images (this may take several minutes)..."
docker compose build --no-cache

# Start services
echo ""
echo "🚀 Starting services..."
docker compose up -d

# Wait for services to start
echo ""
echo "⏳ Waiting for services to initialize..."
sleep 10

# Verify deployment
echo ""
echo "🔍 Verifying deployment..."

# Check services are running
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Services are running${NC}"
else
    echo -e "${RED}❌ Some services failed to start${NC}"
    docker compose ps
    exit 1
fi

# Check Node.js versions
echo ""
echo "📦 Checking Node.js versions..."
FRONTEND_VERSION=$(docker compose exec -T frontend node --version 2>/dev/null || echo "Not ready")
BACKEND_VERSION=$(docker compose exec -T backend node --version 2>/dev/null || echo "Not ready")

echo "   Frontend: $FRONTEND_VERSION"
echo "   Backend:  $BACKEND_VERSION"

if [[ "$FRONTEND_VERSION" == v1[89]* ]] || [[ "$FRONTEND_VERSION" == v2* ]]; then
    echo -e "${GREEN}✅ Frontend Node.js version is correct${NC}"
else
    echo -e "${RED}❌ Frontend Node.js version is incorrect (should be v18+)${NC}"
fi

if [[ "$BACKEND_VERSION" == v1[89]* ]] || [[ "$BACKEND_VERSION" == v2* ]]; then
    echo -e "${GREEN}✅ Backend Node.js version is correct${NC}"
else
    echo -e "${RED}❌ Backend Node.js version is incorrect (should be v18+)${NC}"
fi

# Test endpoints
echo ""
echo "🌐 Testing endpoints..."
SERVER_IP=$(hostname -I | awk '{print $1}')

if curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed (may still be starting)${NC}"
fi

if curl -s http://localhost > /dev/null; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend check failed (may still be starting)${NC}"
fi

# Display access information
echo ""
echo "=================================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=================================================="
echo ""
echo "📋 Access Information:"
echo "   Frontend: http://$SERVER_IP"
echo "   Backend API: http://$SERVER_IP:3001/api"
echo "   Health Check: http://$SERVER_IP:3001/api/health"
echo ""
echo "📊 Useful Commands:"
echo "   View logs:        docker compose logs -f"
echo "   Check status:     docker compose ps"
echo "   Restart services: docker compose restart"
echo "   Stop services:    docker compose down"
echo ""
echo "📚 Documentation:"
echo "   See UBUNTU_DEPLOYMENT.md for detailed instructions"
echo "   See DOCKER_TROUBLESHOOTING.md for troubleshooting"
echo ""

