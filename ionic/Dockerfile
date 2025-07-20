# Multi-stage Dockerfile for Ionic AI Voice Notes App
# Stage 1: Web Asset Compilation with Bun.js
FROM oven/bun:latest-slim AS web-builder

WORKDIR /app

# Copy package files for dependency installation
COPY package.json bun.lockb* ./

# Install dependencies with frozen lockfile for reproducible builds
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build Ionic web application
RUN bunx ionic build --prod

# Stage 2: Android Application Build
FROM bitriseio/android-ndk-lts:latest AS android-builder

# Install Node.js and global CLI tools
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g @ionic/cli @capacitor/cli native-run

WORKDIR /app

# Copy source code and web assets from previous stage
COPY --from=web-builder /app .

# Ensure Capacitor is properly configured
RUN npx ionic capacitor sync android

# Make gradlew executable and build Android APK
WORKDIR /app/android
RUN chmod +x ./gradlew && \
    ./gradlew assembleRelease

# Stage 3: Final output stage
FROM alpine:latest AS final

# Copy built APK from android-builder stage
COPY --from=android-builder /app/android/app/build/outputs/apk/release/app-release.apk /output/

# Copy web assets for potential web deployment
COPY --from=web-builder /app/www /output/www/

# Create a simple script to extract outputs
RUN echo '#!/bin/sh' > /extract.sh && \
    echo 'cp -r /output/* /host/' >> /extract.sh && \
    chmod +x /extract.sh

CMD ["/extract.sh"]

# Note: iOS builds require macOS host and Xcode, not supported in Docker environment