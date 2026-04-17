#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  EduLib — Local Development Setup Script
#  Run once after cloning: bash setup.sh
# ─────────────────────────────────────────────────────────────
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}📚 EduLib — Local Dev Setup${NC}"
echo "────────────────────────────────────"

# ── Check Node ───────────────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js not found. Install from https://nodejs.org (v18+)${NC}"
  exit 1
fi
NODE_VER=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VER}${NC}"

# ── Backend setup ────────────────────────────────────────────
echo ""
echo -e "${CYAN}Setting up backend...${NC}"
cd backend

if [ ! -f .env ]; then
  cp .env.example .env
  echo -e "${YELLOW}⚠  Created backend/.env — fill in your Supabase keys before starting.${NC}"
else
  echo -e "${GREEN}✓ backend/.env already exists${NC}"
fi

npm install --silent
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
cd ..

# ── Frontend setup ───────────────────────────────────────────
echo ""
echo -e "${CYAN}Setting up frontend...${NC}"
cd frontend

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo -e "${GREEN}✓ Created frontend/.env.local${NC}"
else
  echo -e "${GREEN}✓ frontend/.env.local already exists${NC}"
fi

npm install --silent
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
cd ..

# ── Done ─────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────────"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "  ${YELLOW}Next steps:${NC}"
echo "  1. Edit  backend/.env        — add SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET"
echo "  2. Edit  frontend/.env.local — set REACT_APP_API_URL=http://localhost:4000"
echo "  3. Run the Supabase schema:  supabase/schema.sql  (in Supabase SQL Editor)"
echo ""
echo "  To start both servers:"
echo -e "  ${CYAN}Terminal 1:${NC}  cd backend  && npm run dev"
echo -e "  ${CYAN}Terminal 2:${NC}  cd frontend && npm start"
echo ""
echo "  Or with Docker:  docker compose up --build"
echo ""
echo "  To seed sample books (after .env is configured):"
echo -e "  ${CYAN}cd backend && npm run seed${NC}"
echo ""
