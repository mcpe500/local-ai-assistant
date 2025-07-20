# Dockerfile for Local AI Assistant Android Build
FROM ubuntu:22.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    git \
    openjdk-17-jdk \
    python3 \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set JAVA_HOME
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Install Android SDK
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=$ANDROID_HOME
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0

RUN mkdir -p $ANDROID_HOME/cmdline-tools \
    && wget -q https://dl.google.com/android/repository/commandlinetools-linux-10406996_latest.zip \
    && unzip commandlinetools-linux-10406996_latest.zip -d $ANDROID_HOME/cmdline-tools \
    && mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest \
    && rm commandlinetools-linux-10406996_latest.zip

# Accept Android SDK licenses and install required packages
RUN yes | sdkmanager --licenses \
    && sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" "ndk;25.1.8937393"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lock ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Fix package.json name issue (lowercase required for npm)
RUN sed -i 's/"LocalAIAssistant"/"local-ai-assistant"/' package.json

# Create keystore directory
RUN mkdir -p android/app

# Generate a debug keystore for building (replace with your own for production)
RUN keytool -genkeypair -v -keystore android/app/debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"

# Set up gradle properties for debug build
RUN echo "MYAPP_RELEASE_STORE_FILE=debug.keystore" >> android/gradle.properties \
    && echo "MYAPP_RELEASE_KEY_ALIAS=androiddebugkey" >> android/gradle.properties \
    && echo "MYAPP_RELEASE_STORE_PASSWORD=android" >> android/gradle.properties \
    && echo "MYAPP_RELEASE_KEY_PASSWORD=android" >> android/gradle.properties

# Make gradlew executable
RUN chmod +x android/gradlew

# Build the APK
RUN cd android && ./gradlew assembleRelease

# Create output directory
RUN mkdir -p /output

# Copy the built APK to output directory
RUN cp android/app/build/outputs/apk/release/app-release.apk /output/local-ai-assistant.apk

# Set the default command
CMD ["cp", "/output/local-ai-assistant.apk", "/host-output/"]