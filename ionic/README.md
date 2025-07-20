# AI Voice Notes - Multiplatform Voice-Enabled Note-Taking App

A sophisticated, voice-enabled AI-powered note-taking application built with Ionic React, designed for capturing and understanding tasks from meetings. Features flexible AI integration supporting both self-hosted endpoints and optimized on-device processing.

## 🚀 Key Features

- **Voice-to-Text Transcription**: Native audio recording with local/remote transcription options
- **Flexible AI Integration**: Switch between self-hosted (Ollama) and on-device AI processing
- **Offline-First**: Fully functional without internet connection
- **Resource Optimized**: Engineered for 2017-era Android devices with 3GB RAM
- **Cross-Platform**: Built with Ionic for iOS, Android, and web deployment
- **Dockerized Build**: Complete containerized build environment

## 🏗️ Architecture

### AI Processing Modes

#### Remote/Self-Hosted Mode
- Connect to personal Ollama server or compatible API endpoints
- Supports OpenAI-compatible APIs
- Configurable model selection
- Secure credential management

#### On-Device Mode
- WebAssembly-based inference using ONNX Runtime
- Aggressive memory management for resource-constrained devices
- Chunked text processing
- Automatic model loading/unloading

### Tech Stack
- **Framework**: Ionic React with Capacitor
- **Language**: TypeScript
- **State Management**: Zustand with persistence
- **Form Handling**: React Hook Form
- **Build Tool**: Vite
- **Package Manager**: Bun.js
- **AI Runtime**: ONNX Runtime Web
- **Containerization**: Docker multi-stage builds

## 🐳 Docker Build Environment

### Prerequisites
- Docker or Podman installed
- No local SDKs required (Android SDK, Node.js, etc.)

### Single Command Build

Build both web assets and Android APK:

```bash
# Using Docker
docker build -t ai-voice-notes .

# Using Podman
podman build -t ai-voice-notes .
```

### Extract Build Artifacts

```bash
# Create output directory
mkdir -p ./output

# Extract built files
docker run --rm -v $(pwd)/output:/host ai-voice-notes

# Find your APK in:
# ./output/app-release.apk
# ./output/www/ (web assets)
```

### Build Stages Explained

#### Stage 1: Web Asset Compilation (Bun.js)
- Base: `oven/bun:latest-slim`
- Installs dependencies with `bun install --frozen-lockfile`
- Builds optimized web assets with `bunx ionic build`
- Output: `/app/www` directory

#### Stage 2: Android Build
- Base: `bitriseio/android-ndk-lts`
- Installs Ionic/Capacitor CLIs
- Syncs web assets to native project
- Builds release APK with Gradle

#### Stage 3: Output Collection
- Collects APK and web assets
- Provides extraction script

### iOS Build Limitation
**Note**: iOS builds require macOS host with Xcode and are not supported in this Docker environment. For iOS development, use a macOS machine with native toolchain.

## 📱 Installation & Setup

### Development Setup

1. **Clone and Install**
```bash
git clone <repository-url>
cd ionic
bun install
```

2. **Start Development Server**
```bash
bun run start
# or
ionic serve
```

3. **Add Platforms**
```bash
# Android
ionic capacitor add android

# iOS (macOS only)
ionic capacitor add ios
```

### Production Build

#### Web Build
```bash
bun run build
```

#### Native Builds
```bash
# Sync web assets
ionic capacitor sync

# Android
ionic capacitor run android --prod

# iOS (macOS only)
ionic capacitor run ios --prod
```

## ⚙️ Configuration

### AI Configuration

#### Self-Hosted Setup (Ollama)

1. **Install Ollama**
```bash
# Linux/macOS
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download
```

2. **Pull Models**
```bash
ollama pull llama2
ollama pull mistral
ollama pull codellama
```

3. **Start Server**
```bash
ollama serve
# Default: http://localhost:11434
```

4. **App Configuration**
- Open Settings tab
- Select "Remote/Self-Hosted" mode
- Endpoint: `http://localhost:11434/api/generate`
- Model: `llama2` (or your preferred model)
- API Key: Leave empty for local Ollama

#### OpenAI Compatible APIs

```
Endpoint: https://api.openai.com/v1/chat/completions
API Key: sk-your-api-key-here
Model: gpt-3.5-turbo
```

#### On-Device Configuration

1. Select "On-Device" mode in settings
2. Model will auto-load when needed
3. Monitor memory usage in settings
4. Recommended for privacy-sensitive use cases

### Transcription Setup

#### Local Transcription (Default)
- Uses WebAssembly-based speech recognition
- Fully offline
- No configuration required

#### Remote Transcription
- Endpoint: `https://api.openai.com/v1/audio/transcriptions`
- Requires API key
- Higher accuracy for complex audio

## 🔧 Development

### Project Structure
```
ionic/
├── src/
│   ├── components/          # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   │   ├── useAI.ts        # AI processing logic
│   │   ├── useOnDeviceAI.ts # WASM-based local AI
│   │   ├── useRemoteAI.ts  # Remote API integration
│   │   ├── useVoiceRecording.ts # Audio capture
│   │   └── useTranscription.ts  # Speech-to-text
│   ├── pages/              # Main app screens
│   ├── store/              # Zustand state management
│   └── theme/              # Styling and themes
├── public/                 # Static assets
├── android/               # Native Android project
├── Dockerfile             # Multi-stage build config
└── capacitor.config.ts    # Capacitor configuration
```

### Key Hooks

#### `useAI()`
```typescript
const { summarizeMeeting, extractActionItems, analyzeNotes } = useAI();

// Summarize meeting notes
const result = await summarizeMeeting(noteContent);
```

#### `useVoiceRecording()`
```typescript
const { startRecording, stopRecording, audioBlob } = useVoiceRecording();

// Start recording
await startRecording();

// Stop and get audio
const blob = await stopRecording();
```

#### `useAppStore()`
```typescript
const { notes, addNote, updateNote, settings } = useAppStore();

// Add new note
addNote({
  title: 'Meeting Notes',
  content: 'Discussion points...',
  tags: ['meeting', 'project']
});
```

### State Management

Uses Zustand for simple, efficient state management:

```typescript
interface AppState {
  notes: Note[];
  settings: AppSettings;
  isRecording: boolean;
  isProcessing: boolean;
  // ... actions
}
```

Persisted to device storage automatically.

### Form Handling

Uses React Hook Form for efficient form management:

```typescript
const { control, handleSubmit } = useForm<FormData>();

<Controller
  name="title"
  control={control}
  render={({ field }) => (
    <IonInput {...field} placeholder="Note title" />
  )}
/>
```

## 🎯 Usage

### Recording Voice Notes

1. Navigate to "Record" tab
2. Tap microphone button to start recording
3. Speak clearly into device
4. Tap stop button when finished
5. Review auto-generated transcription
6. Edit and save note

### AI Analysis

1. Open any note from "Notes" tab
2. Tap menu button (⋮)
3. Select AI action:
   - **Summarize Meeting**: Extract key points
   - **Extract Action Items**: Find tasks and assignments
   - **Analyze Notes**: General insights and analysis

### Settings Configuration

1. Navigate to "Settings" tab
2. Configure AI mode (Remote vs On-Device)
3. Set up API endpoints and credentials
4. Adjust transcription preferences
5. Customize app behavior

## 🔒 Privacy & Security

### Data Storage
- All notes stored locally on device
- No cloud synchronization by default
- Encrypted storage using Capacitor Filesystem API

### AI Processing
- **On-Device Mode**: Complete privacy, no data leaves device
- **Remote Mode**: Data sent to configured endpoint only
- **API Keys**: Stored securely in device keychain

### Permissions
- **Microphone**: Required for voice recording
- **Storage**: Required for note persistence
- **Network**: Optional, for remote AI/transcription

## 📊 Performance Considerations

### Memory Management
- Aggressive model loading/unloading
- Chunked text processing
- Memory usage monitoring
- Optimized for 3GB RAM devices

### AI Mode Trade-offs

| Feature | Remote Mode | On-Device Mode |
|---------|-------------|----------------|
| **Speed** | Fast (depends on connection) | Slower |
| **Privacy** | Depends on endpoint | Complete |
| **Offline** | No | Yes |
| **Accuracy** | High | Moderate |
| **Resource Usage** | Low | High |
| **Model Variety** | Unlimited | Limited |

### Recommendations

- **Use Remote Mode** for: Better accuracy, faster processing, complex analysis
- **Use On-Device Mode** for: Privacy-sensitive content, offline usage, resource constraints

## 🛠️ Troubleshooting

### Build Issues

**Docker build fails:**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t ai-voice-notes .
```

**Bun install issues:**
```bash
# Clear Bun cache
bun pm cache rm

# Reinstall dependencies
rm -rf node_modules bun.lockb
bun install
```

### Runtime Issues

**Recording not working:**
- Check microphone permissions
- Ensure HTTPS in browser (required for MediaRecorder)
- Test on physical device (not emulator)

**AI processing fails:**
- Verify endpoint URL and API key
- Check network connectivity
- Monitor memory usage in settings

**On-device AI slow:**
- Reduce text chunk size
- Close other apps to free memory
- Consider switching to Remote mode

### Memory Issues

**High memory usage:**
- Enable auto-unload in settings
- Process shorter text segments
- Restart app periodically
- Use Remote mode for large documents

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use React Hook Form for forms
- Implement proper error handling
- Add loading states for async operations
- Test on resource-constrained devices
- Document new AI integrations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Ionic Framework](https://ionicframework.com/) - Cross-platform mobile development
- [ONNX Runtime](https://onnxruntime.ai/) - On-device AI inference
- [Ollama](https://ollama.ai/) - Local LLM serving
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [React Hook Form](https://react-hook-form.com/) - Form handling

---

**Built with ❤️ for privacy-focused, offline-capable AI note-taking**