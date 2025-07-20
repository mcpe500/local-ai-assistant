@echo off
REM AI Voice Notes - Docker Build Script for Windows
REM Builds both web assets and Android APK using Docker

echo 🚀 Starting AI Voice Notes Docker Build...

REM Build the Docker image
echo 📦 Building Docker image...
docker build -t ai-voice-notes . || (
    echo ❌ Docker build failed
    exit /b 1
)

echo ✅ Docker image built successfully

REM Create output directory
echo 📁 Creating output directory...
if not exist "output" mkdir output

REM Extract build artifacts
echo 📤 Extracting build artifacts...
docker run --rm -v "%cd%/output:/host" ai-voice-notes || (
    echo ❌ Failed to extract build artifacts
    exit /b 1
)

REM Check if APK was created
if exist "output\app-release.apk" (
    echo ✅ Android APK created: output\app-release.apk
    
    REM Get APK size
    for %%A in ("output\app-release.apk") do (
        echo 📱 APK Size: %%~zA bytes
    )
) else (
    echo ⚠️  APK not found in output
)

REM Check if web assets were created
if exist "output\www" (
    echo ✅ Web assets created: output\www\
) else (
    echo ⚠️  Web assets not found in output
)

echo 🎉 Build completed successfully!
echo 📋 Build artifacts available in .\output\
echo.
echo Next steps:
echo   • Install APK: adb install .\output\app-release.apk
echo   • Deploy web: Copy .\output\www\ to your web server
echo   • Test locally: ionic serve (for development)

pause