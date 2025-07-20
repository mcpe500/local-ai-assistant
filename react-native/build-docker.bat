@echo off
REM Build script for Local AI Assistant APK using Docker on Windows
echo 🚀 Building Local AI Assistant APK with Docker...

REM Create output directory
if not exist output mkdir output

REM Build the Docker image
echo 📦 Building Docker image...
docker build -t local-ai-assistant .

if %errorlevel% neq 0 (
    echo ❌ Container build failed!
    pause
    exit /b 1
)

REM Run the container to build APK
echo 🔨 Building APK inside container...
docker run --rm -v "%cd%/output:/host-output" local-ai-assistant

if %errorlevel% equ 0 (
    echo ✅ Build complete! APK available at: output/local-ai-assistant.apk
    echo.
    echo 📋 To install on your Android device:
    echo 1. Enable Developer Options and USB Debugging
    echo 2. Connect your device via USB
    echo 3. Run: adb install output/local-ai-assistant.apk
    echo.
    echo 🤖 Make sure Ollama is running with the required models:
    echo ollama pull qwen2:0.6b
    echo ollama pull nomic-embed-text
    echo.
    echo 🎯 Your local AI assistant is ready to use!
) else (
    echo ❌ APK build failed!
    pause
    exit /b 1
)

pause