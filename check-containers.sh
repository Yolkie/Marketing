#!/bin/bash

# Quick diagnostic script for Docker containers

echo "🔍 Checking Docker containers status..."
echo ""

# Check container status
echo "📊 Container Status:"
docker ps -a | grep marketing

echo ""
echo "📋 Detailed Status:"
docker compose ps

echo ""
echo "📝 Frontend Logs (last 50 lines):"
docker compose logs --tail=50 frontend 2>&1 || echo "No logs available"

echo ""
echo "📝 Backend Logs (last 50 lines):"
docker compose logs --tail=50 backend 2>&1 || echo "No logs available"

echo ""
echo "📝 Database Logs (last 50 lines):"
docker compose logs --tail=50 postgres 2>&1 || echo "No logs available"

echo ""
echo "🌐 Port Mappings:"
docker compose ps --format json 2>/dev/null | grep -o '"Ports":"[^"]*"' || docker ps --format "table {{.Names}}\t{{.Ports}}" | grep marketing

echo ""
echo "💡 To view live logs: docker compose logs -f"
echo "💡 To restart: docker compose restart"
echo "💡 To see full logs: docker compose logs"

