# Quick fix script for Node.js version issues in Docker (PowerShell)

Write-Host "🔧 Fixing Docker Node.js version issue..." -ForegroundColor Cyan
Write-Host ""

# Stop and remove existing containers
Write-Host "1. Stopping existing containers..." -ForegroundColor Yellow
docker-compose down -v 2>$null

# Remove old images
Write-Host "2. Removing old images..." -ForegroundColor Yellow
docker rmi marketing-dashboard-frontend marketing-dashboard-backend 2>$null

# Clean up any orphaned containers
Write-Host "3. Cleaning up..." -ForegroundColor Yellow
docker system prune -f

# Rebuild with no cache
Write-Host "4. Rebuilding images with Node.js 18..." -ForegroundColor Yellow
docker-compose build --no-cache

# Start services
Write-Host "5. Starting services..." -ForegroundColor Yellow
docker-compose up -d

# Wait a moment for services to start
Write-Host "6. Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verify Node.js versions
Write-Host ""
Write-Host "7. Verifying Node.js versions:" -ForegroundColor Yellow
$frontendVersion = docker-compose exec -T frontend node --version 2>$null
$backendVersion = docker-compose exec -T backend node --version 2>$null
Write-Host "   Frontend: $frontendVersion" -ForegroundColor Green
Write-Host "   Backend:  $backendVersion" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Done! Check status with: docker-compose ps" -ForegroundColor Green
Write-Host "📋 View logs with: docker-compose logs -f" -ForegroundColor Green

