#!/bin/bash

# WebCraft Platform Setup Script
# This script helps you set up the WebCraft platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   ██╗    ██╗███████╗██████╗  ██████╗██████╗  █████╗ ███████╗████████╗  ║"
echo "║   ██║    ██║██╔════╝██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔════╝╚══██╔══╝  ║"
echo "║   ██║ █╗ ██║█████╗  ██████╔╝██║     ██████╔╝███████║█████╗     ██║     ║"
echo "║   ██║███╗██║██╔══╝  ██╔══██╗██║     ██╔══██╗██╔══██║██╔══╝     ██║     ║"
echo "║   ╚███╔███╔╝███████╗██████╔╝╚██████╗██║  ██║██║  ██║██║        ██║     ║"
echo "║    ╚══╝╚══╝ ╚══════╝╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝        ╚═╝     ║"
echo "║                                                              ║"
echo "║              Universal No-Code Platform                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Check system requirements
echo ""
echo -e "${BLUE}Checking system requirements...${NC}"
echo ""

# Check Docker
if command_exists docker; then
    DOCKER_VERSION=$(docker --version | cut -d ' ' -f 3 | cut -d ',' -f 1)
    print_status "Docker installed (v$DOCKER_VERSION)"
else
    print_error "Docker is not installed"
    echo "    Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if docker info >/dev/null 2>&1; then
    print_status "Docker is running"
else
    print_error "Docker is not running"
    echo "    Please start Docker Desktop and try again"
    exit 1
fi

# Check Docker Compose
if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
    print_status "Docker Compose installed"
else
    print_error "Docker Compose is not installed"
    exit 1
fi

# Check available memory
AVAILABLE_MEM=$(free -g 2>/dev/null | awk '/^Mem:/{print $7}' || echo "4")
if [ "$AVAILABLE_MEM" -ge 4 ]; then
    print_status "Available memory: ${AVAILABLE_MEM}GB"
else
    print_warning "Low available memory: ${AVAILABLE_MEM}GB (recommended: 4GB+)"
fi

# Check available disk space
AVAILABLE_DISK=$(df -BG . | awk 'NR==2 {print $4}' | tr -d 'G')
if [ "$AVAILABLE_DISK" -ge 10 ]; then
    print_status "Available disk space: ${AVAILABLE_DISK}GB"
else
    print_warning "Low disk space: ${AVAILABLE_DISK}GB (recommended: 10GB+)"
fi

echo ""
echo -e "${GREEN}System requirements check passed!${NC}"
echo ""

# Setup mode selection
echo "How would you like to set up WebCraft?"
echo ""
echo "  1) Quick Setup (Docker - Recommended)"
echo "     Uses Docker for all services. Best for getting started quickly."
echo ""
echo "  2) Web Setup Wizard"
echo "     Start services and use the web-based setup wizard."
echo ""
echo "  3) Development Setup"
echo "     For developers who want to run services locally."
echo ""
read -p "Select option [1-3]: " SETUP_MODE

case $SETUP_MODE in
    1)
        echo ""
        print_info "Starting Quick Setup..."
        
        # Copy environment file if not exists
        if [ ! -f .env ]; then
            cp .env.example .env
            print_status "Created .env file from template"
        fi
        
        # Generate JWT secret
        JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
        sed -i.bak "s/your-super-secret-jwt-key-change-in-production/$JWT_SECRET/" .env 2>/dev/null || true
        
        echo ""
        print_info "Starting Docker services..."
        
        # Start services
        if docker compose version >/dev/null 2>&1; then
            docker compose up -d
        else
            docker-compose up -d
        fi
        
        echo ""
        print_info "Waiting for services to start..."
        sleep 10
        
        # Check if services are running
        echo ""
        if curl -s http://localhost:8000/health >/dev/null 2>&1; then
            print_status "API is running at http://localhost:8000"
        else
            print_warning "API is still starting..."
        fi
        
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            print_status "Frontend is running at http://localhost:3000"
        else
            print_warning "Frontend is still starting..."
        fi
        
        echo ""
        echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                    Setup Complete!                           ║${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo "  Open your browser and go to:"
        echo ""
        echo -e "    ${BLUE}http://localhost:3000/setup${NC}"
        echo ""
        echo "  to complete the setup wizard."
        echo ""
        echo "  API Documentation: http://localhost:8000/docs"
        echo ""
        ;;
        
    2)
        echo ""
        print_info "Starting Web Setup Wizard..."
        
        # Copy environment file if not exists
        if [ ! -f .env ]; then
            cp .env.example .env
            print_status "Created .env file from template"
        fi
        
        # Start only essential services
        if docker compose version >/dev/null 2>&1; then
            docker compose up -d postgres redis
        else
            docker-compose up -d postgres redis
        fi
        
        echo ""
        print_info "Starting API and Frontend..."
        
        if docker compose version >/dev/null 2>&1; then
            docker compose up -d api web
        else
            docker-compose up -d api web
        fi
        
        echo ""
        print_info "Waiting for services..."
        sleep 15
        
        echo ""
        echo -e "${GREEN}Services started!${NC}"
        echo ""
        echo "  Open your browser and go to:"
        echo ""
        echo -e "    ${BLUE}http://localhost:3000/setup${NC}"
        echo ""
        echo "  to complete the setup wizard."
        echo ""
        ;;
        
    3)
        echo ""
        print_info "Development Setup"
        echo ""
        echo "For development, you'll need:"
        echo "  - Node.js 18+"
        echo "  - Python 3.11+"
        echo "  - PostgreSQL 15+"
        echo "  - Redis 7+"
        echo ""
        
        # Check Node.js
        if command_exists node; then
            NODE_VERSION=$(node -v)
            print_status "Node.js installed ($NODE_VERSION)"
        else
            print_error "Node.js is not installed"
            echo "    Install from https://nodejs.org/"
        fi
        
        # Check Python
        if command_exists python3; then
            PYTHON_VERSION=$(python3 --version)
            print_status "Python installed ($PYTHON_VERSION)"
        else
            print_error "Python 3 is not installed"
        fi
        
        echo ""
        echo "Development setup steps:"
        echo ""
        echo "  1. Start infrastructure services:"
        echo "     docker compose up -d postgres redis kafka zookeeper"
        echo ""
        echo "  2. Install backend dependencies:"
        echo "     cd apps/api && pip install -r requirements.txt"
        echo ""
        echo "  3. Install frontend dependencies:"
        echo "     cd apps/web && npm install"
        echo ""
        echo "  4. Start backend:"
        echo "     cd apps/api && uvicorn main:app --reload"
        echo ""
        echo "  5. Start frontend:"
        echo "     cd apps/web && npm run dev"
        echo ""
        ;;
        
    *)
        print_error "Invalid option"
        exit 1
        ;;
esac

echo ""
print_info "Need help? Check the documentation at https://github.com/your-org/webcraft"
echo ""
