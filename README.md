# Local AI Assistant

This is a React Native Android application that acts as a local-first AI assistant. It captures user voice input or text input, processes it using a local Ollama model with Retrieval-Augmented Generation (RAG) against persistent, switchable knowledge bases, and displays the result. Chat interactions also contribute to the AI's knowledge.

## Core Technologies

*   **Framework:** React Native
*   **AI Backend:** Local Ollama server
*   **Target AI Model:** `qwen2` (for generation), `nomic-embed-text` (for embeddings) - configurable in code.
*   **RAG Library:** `react-native-rag`
*   **Voice-to-Text:** `react-native-voice`
*   **Persistence:** `AsyncStorage` for knowledge bases.

## Features

*   **Voice Input:** Press and hold a button to speak your query.
*   **Text Input:** Type your queries directly.
*   **Local Processing:** All AI processing (Voice-to-Text, RAG, LLM inference) happens on the device.
*   **Ollama Integration:** Connects to a local Ollama server instance.
*   **Retrieval-Augmented Generation (RAG):** Enhances LLM responses with information from a dynamic, local knowledge base.
*   **Persistent Knowledge Bases:**
    *   Create multiple, named knowledge bases (vector stores) via the Settings screen.
    *   Knowledge is saved to device storage (`AsyncStorage`) and persists across app sessions.
    *   Select which knowledge base is active for querying and adding new information.
    *   Delete knowledge bases.
*   **Chat as RAG Data:** User queries and AI responses from the chat screen ("Assistant" tab) are automatically added as documents to the active knowledge base, allowing the AI to learn from interactions.
*   **Manual Document Entry:** Add text documents directly to the active knowledge base via the "Add to KB" tab.
*   **Offline Capable:** Designed to work offline, assuming the Ollama server is running locally on the device.

## Prerequisites

1.  **Node.js & npm/yarn:** Ensure you have Node.js (>=18) and npm or yarn installed.
2.  **React Native Environment:** Set up your machine for React Native development (Android). Follow the [official React Native documentation](https://reactnative.dev/docs/environment-setup?guide=native) for "React Native CLI Quickstart", selecting "Android" as the Development OS and Target OS.
3.  **Android Studio & SDK:** Android Studio, SDK, and emulators/device set up.
4.  **Ollama Server on Device:**
    *   Install [Ollama on your Android device](https://ollama.com/blog/ollama-is-now-available-on-android-preview) or run it on a reachable local network address from your development machine/emulator (you might need to change `OLLAMA_API_BASE_URL` in `src/hooks/OllamaProvider.ts` if not `http://localhost:11434`).
    *   Ensure the Ollama server is running.
    *   Pull the required models:
        ```bash
        ollama pull qwen2
        ollama pull nomic-embed-text
        ```
        *(Note: The application is configured to use `qwen2` for generation and `nomic-embed-text` for embeddings. These are initialized in `src/App.tsx` and passed to the `VectorStoreProvider`.)*

## Installation

1.  **Clone the repository (if applicable) or ensure you have the project files.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
    or
    ```bash
    yarn install
    ```

## Running the App (Development Mode)

1.  **Ensure your Ollama server is running and the required models are pulled.**
2.  **Start the Metro bundler:**
    ```bash
    npm start
    ```
    or
    ```bash
    yarn start
    ```
3.  **In a new terminal, run the app on your Android emulator or connected device:**
    ```bash
    npm run android
    ```
    or
    ```bash
    yarn android
    ```
    If you encounter issues, ensure you grant microphone permissions to the app when prompted.

## Using the App

1.  **Settings Tab:**
    *   Upon first launch, or if no knowledge base (KB) is active, go to the "Settings" tab.
    *   Create a new knowledge base by typing a name and pressing "Create New".
    *   The first KB created will automatically become active.
    *   You can select any existing KB to make it active or delete KBs.
2.  **Assistant Tab:**
    *   Once a KB is active, you can chat with the AI. Use the microphone button for voice input or type your query and press "Send Typed Query".
    *   Your questions and the AI's answers will be automatically saved to the active KB.
3.  **Add to KB Tab:**
    *   Manually add larger pieces of text as documents to the active knowledge base.
    *   Optionally add simple text metadata.

## Building a Release APK

1.  **Ensure your Ollama server setup is stable and models are present on the target device where the APK will be installed.** The APK itself will not bundle Ollama or the models.
2.  **Generate a signing key (if you don't have one already):**
    Follow the instructions in the [React Native documentation for generating a signing key](https://reactnative.dev/docs/signed-apk-android#generating-a-signing-key). Place the `my-release-key.keystore` file in the `android/app` directory.
3.  **Set up Gradle variables:**
    Create or edit the file `android/gradle.properties` (create it if it doesn't exist) and add the following lines, replacing placeholders with your actual keystore details:
    ```properties
    MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
    MYAPP_RELEASE_KEY_ALIAS=my-key-alias
    MYAPP_RELEASE_STORE_PASSWORD=your_store_password
    MYAPP_RELEASE_KEY_PASSWORD=your_key_password
    ```
    *Ensure these credentials are kept secure and are not committed to version control if the project is public.*
4.  **Clean previous builds (optional but recommended):**
    ```bash
    cd android
    ./gradlew clean
    cd ..
    ```
5.  **Build the release APK:**
    ```bash
    cd android
    ./gradlew assembleRelease
    ```
    The generated APK will be located at `android/app/build/outputs/apk/release/app-release.apk`.

## Notes & Considerations

*   **Data Storage:** Knowledge bases are stored using `AsyncStorage`. This is generally fine for text data, but for very large KBs or a high number of KBs, performance might eventually degrade, or storage limits could be hit.
*   **`MemoryVectorStore` Internals:** The persistence mechanism in `src/lib/VectorStorePersister.ts` relies on the internal structure of `MemoryVectorStore` from `react-native-rag`. If this structure changes in future library updates, the persister might need adjustments.
*   **Ollama Server Management:** This application assumes an Ollama server is already running. Managing the Ollama server lifecycle is outside the scope of this application.
*   **Error Handling:** While basic error handling is in place, it can be further improved for a production application.
*   **iOS Compatibility:** This project has been configured and tested primarily for Android. Additional setup would be required for iOS.

## Troubleshooting

*   **`usesCleartextTraffic`:** The `AndroidManifest.xml` includes `android:usesCleartextTraffic="true"` to allow HTTP communication with `http://localhost:11434`. For production releases targeting higher Android API levels, consider Network Security Configuration.
*   **Voice Recognition Issues:** Ensure microphone permissions are granted.
*   **Ollama Connection Issues:** Verify Ollama is running and accessible. If using a physical device and running Ollama on your PC, ensure they are on the same network and update `OLLAMA_API_BASE_URL` in `src/hooks/OllamaProvider.ts` to your PC's local IP address (e.g., `http://192.168.1.100:11434`).
*   **`react-native-vector-icons`:** If icons are not showing, ensure Gradle setup is correct and try rebuilding.

This README provides a guide to setting up, running, and building the Local AI Assistant application with its enhanced knowledge base features.
