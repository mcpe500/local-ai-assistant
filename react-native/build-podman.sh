#!/bin/bash

# Build script for Local AI Assistant APK using Podman
echo "🚀 Building Local AI Assistant APK with Podman..."

# Create output directory
mkdir -p output

# Build the Podman image
echo "📦 Building Podman image..."
podman build -t local-ai-assistant .

if [ $? -ne 0 ]; then
    echo "❌ Container build failed!"
    exit 1
fi

# Run the container to build APK
echo "🔨 Building APK inside container..."
podman run --rm -v "$(pwd)/output:/host-output:Z" local-ai-assistant

if [ $? -eq 0 ]; then
    echo "✅ Build complete! APK available at: output/local-ai-assistant.apk"
    echo "📱 APK size: $(du -h output/local-ai-assistant.apk | cut -f1)"
    echo ""
    echo "📋 To install on your Android device:"
    echo "1. Enable Developer Options and USB Debugging"
    echo "2. Connect your device via USB"
    echo "3. Run: adb install output/local-ai-assistant.apk"
    echo ""
    echo "🤖 Make sure Ollama is running with the required models:"
    echo "ollama pull qwen2:0.6b"
    echo "ollama pull nomic-embed-text"
    echo ""
    echo "🎯 Your local AI assistant is ready to use!"
else
    echo "❌ APK build failed!"
    exit 1
fi