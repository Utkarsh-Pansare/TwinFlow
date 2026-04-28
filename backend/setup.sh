#!/bin/bash

# 🚀 TwinFlow Backend Quick Setup Script
# Automate initial backend setup for development

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║  🚀 TwinFlow Backend - Quick Setup                        ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js not found${NC}"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo -e "${RED}✗ npm not found${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Node.js $(node --version)${NC}"
echo -e "${GREEN}✓ npm $(npm --version)${NC}"

# Choose setup method
echo ""
echo "Select setup method:"
echo "1) Local (requires PostgreSQL & Redis running)"
echo "2) Docker Compose (everything containerized)"
read -p "Choice [1-2]: " setup_choice

if [ "$setup_choice" = "1" ]; then
  echo ""
  echo "🛠️  Local Setup"
  echo "─────────────────────────────────────────────────────────"
  
  # Check if PostgreSQL is running
  if ! psql -U postgres -c "SELECT 1" &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL not responding${NC}"
    echo "Start PostgreSQL:"
    echo "  macOS: brew services start postgresql"
    echo "  Linux: sudo systemctl start postgresql"
    echo "  Windows: pg_ctl -D 'C:\\Program Files\\PostgreSQL\\16\\data' start"
    exit 1
  fi
  
  # Check if Redis is running
  if ! redis-cli ping &> /dev/null; then
    echo -e "${YELLOW}⚠️  Redis not responding${NC}"
    echo "Start Redis:"
    echo "  macOS: brew services start redis"
    echo "  Linux: sudo systemctl start redis"
    exit 1
  fi
  
  echo -e "${GREEN}✓ PostgreSQL connected${NC}"
  echo -e "${GREEN}✓ Redis connected${NC}"
  
elif [ "$setup_choice" = "2" ]; then
  echo ""
  echo "🐳 Docker Setup"
  echo "─────────────────────────────────────────────────────────"
  
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found${NC}"
    echo "Install Docker: https://www.docker.com/products/docker-desktop"
    exit 1
  fi
  
  if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose not found${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✓ Docker available${NC}"
  echo -e "${GREEN}✓ Docker Compose available${NC}"
  
else
  echo -e "${RED}Invalid choice${NC}"
  exit 1
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
if [ ! -d "node_modules" ]; then
  npm install
  echo -e "${GREEN}✓ Dependencies installed${NC}"
else
  echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# Setup environment
echo ""
echo "⚙️  Setting up environment..."
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "${GREEN}✓ .env created (update with your values)${NC}"
else
  echo -e "${GREEN}✓ .env already exists${NC}"
fi

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
npm run prisma:generate

if [ "$setup_choice" = "1" ]; then
  # Local setup
  echo ""
  echo "🗄️  Setting up database..."
  
  # Run migrations
  echo "Running migrations..."
  npm run prisma:migrate
  
  # Seed data
  echo ""
  read -p "Seed database with 10,000 shipments? [y/N]: " seed_choice
  if [ "$seed_choice" = "y" ] || [ "$seed_choice" = "Y" ]; then
    npm run db:seed
    echo -e "${GREEN}✓ Database seeded${NC}"
  fi
  
  # Ready to run
  echo ""
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║                                                            ║"
  echo "║  ✅ Setup Complete!                                       ║"
  echo "║                                                            ║"
  echo "║  Run development server:                                  ║"
  echo "║  $ npm run dev                                            ║"
  echo "║                                                            ║"
  echo "║  API: http://localhost:3000                              ║"
  echo "║  Health: http://localhost:3000/health                    ║"
  echo "║  API Docs: http://localhost:3000/api                     ║"
  echo "║                                                            ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  
elif [ "$setup_choice" = "2" ]; then
  # Docker setup
  echo ""
  echo "🚀 Starting Docker containers..."
  docker-compose -f docker-compose.dev.yml up -d
  
  # Wait for services
  echo ""
  echo "⏳ Waiting for services to be ready..."
  sleep 5
  
  # Check if containers are running
  if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Containers running${NC}"
  else
    echo -e "${RED}✗ Containers failed to start${NC}"
    docker-compose -f docker-compose.dev.yml logs
    exit 1
  fi
  
  # Ready
  echo ""
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║                                                            ║"
  echo "║  ✅ Docker Setup Complete!                               ║"
  echo "║                                                            ║"
  echo "║  Containers running:                                      ║"
  echo "║  • PostgreSQL on port 5432                               ║"
  echo "║  • Redis on port 6379                                    ║"
  echo "║  • API on port 3000                                      ║"
  echo "║                                                            ║"
  echo "║  View logs:                                              ║"
  echo "║  $ docker-compose -f docker-compose.dev.yml logs -f     ║"
  echo "║                                                            ║"
  echo "║  Stop containers:                                         ║"
  echo "║  $ docker-compose -f docker-compose.dev.yml down        ║"
  echo "║                                                            ║"
  echo "║  API: http://localhost:3000                              ║"
  echo "║  Health: http://localhost:3000/health                    ║"
  echo "║                                                            ║"
  echo "╚════════════════════════════════════════════════════════════╝"
fi

echo ""
echo "💡 Next steps:"
echo "1. Review .env configuration"
echo "2. Start development server"
echo "3. Test API endpoints"
echo "4. Check API.md for endpoint documentation"
echo ""
