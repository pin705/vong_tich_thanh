#!/bin/bash

# Script tự động pull, build và reload PM2
# Sử dụng: ./deploy.sh

echo "🚀 Starting deployment..."

# Màu sắc cho output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Pull code mới từ git
echo -e "${YELLOW}📥 Pulling latest code from git...${NC}"
git pull origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git pull failed!${NC}"
    exit 1
fi

# 2. Install dependencies (nếu có thay đổi)
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pnpm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Dependencies installation failed!${NC}"
    exit 1
fi

# 3. Build project
echo -e "${YELLOW}🔨 Building project...${NC}"
pnpm build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

# 4. Reload PM2 (zero-downtime)
echo -e "${YELLOW}♻️  Reloading PM2...${NC}"
pm2 reload ecosystem.config.cjs

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ PM2 reload failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🎉 Application is now running with latest code${NC}"

# Hiển thị status
pm2 list
