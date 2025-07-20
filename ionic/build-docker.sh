#!/bin/bash

# AI Voice Notes - Docker Build Script
# Builds both web assets and Android APK using Docker

set -e

echo "🚀 Starting AI Voice Notes Docker Build..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Build the Docker image
echo -e "${BLUE}📦 Building Docker image...${NC}"
docker build -t ai-voice-notes . || {
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Docker image built successfully${NC}"

# Create output directory
echo -e "${BLUE}📁 Creating output directory...${NC}"
mkdir -p ./output

# Extract build artifacts
echo -e "${BLUE}📤 Extracting build artifacts...${NC}"
docker run --rm -v "$(pwd)/output:/host" ai-voice-notes || {
    echo -e "${RED}❌ Failed to extract build artifacts${NC}"
    exit 1
}

# Check if APK was created
if [ -f "./output/app-release.apk" ]; then
    echo -e "${GREEN}✅ Android APK created: ./output/app-release.apk${NC}"
    
    # Get APK size
    APK_SIZE=$(du -h "./output/app-release.apk" | cut -f1)
    echo -e "${BLUE}📱 APK Size: ${APK_SIZE}${NC}"
else
    echo -e "${YELLOW}⚠️  APK not found in output${NC}"
fi

# Check if web assets were created
if [ -d "./output/www" ]; then
    echo -e "${GREEN}✅ Web assets created: ./output/www/${NC}"
    
    # Get web assets size
    WEB_SIZE=$(du -sh "./output/www" | cut -f1)
    echo -e "${BLUE}🌐 Web Assets Size: ${WEB_SIZE}${NC}"
else
    echo -e "${YELLOW}⚠️  Web assets not found in output${NC}"
fi

echo -e "${GREEN}🎉 Build completed successfully!${NC}"
echo -e "${BLUE}📋 Build artifacts available in ./output/${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  • Install APK: adb install ./output/app-release.apk"
echo "  • Deploy web: Copy ./output/www/ to your web server"
echo "  • Test locally: ionic serve (for development)"