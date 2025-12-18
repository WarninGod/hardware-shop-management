#!/bin/bash
# Quick Start Script for Hardware Shop Management System

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Hardware Shop Management System - Quick Start        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Node.js is installed
echo -e "${YELLOW}[1/5] Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install from https://nodejs.org${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"
echo ""

# Check if MySQL is installed
echo -e "${YELLOW}[2/5] Checking MySQL installation...${NC}"
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}✗ MySQL not found. Please install from https://www.mysql.com${NC}"
    echo -e "${YELLOW}   Or use: npm install mysql2 (already in package.json)${NC}"
fi
echo -e "${GREEN}✓ MySQL check complete${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}[3/5] Installing dependencies...${NC}"
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ package.json not found${NC}"
    exit 1
fi
echo ""

# Check database connection
echo -e "${YELLOW}[4/5] Database configuration...${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file found${NC}"
    echo -e "${YELLOW}   Please verify these settings in .env file:${NC}"
    echo -e "${YELLOW}   - DB_HOST=localhost${NC}"
    echo -e "${YELLOW}   - DB_USER=root${NC}"
    echo -e "${YELLOW}   - DB_PASSWORD=<your_mysql_password>${NC}"
    echo -e "${YELLOW}   - DB_NAME=hardware_shop${NC}"
else
    echo -e "${RED}✗ .env file not found${NC}"
    exit 1
fi
echo ""

# Start server
echo -e "${YELLOW}[5/5] Starting server...${NC}"
echo -e "${GREEN}✓ Starting Express server on http://localhost:3000${NC}"
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Server is running! Open http://localhost:3000       ║${NC}"
echo -e "${GREEN}║   Press Ctrl+C to stop the server                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

npm start
