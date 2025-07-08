// src/screens/MainScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRAG, MemoryVectorStore } from 'react-native-rag';
import { OllamaLLM, OllamaEmbeddings } from '../hooks/OllamaProvider';
import ListenButton from '../components/ListenButton';

// Initialize outside of component to persist store
const ollamaLLM = new OllamaLLM('qwen2'); // Or your chosen model
const ollamaEmbeddings = new OllamaEmbeddings('nomic-embed-text'); // Or your chosen model
const vectorStore = new MemoryVectorStore({ embeddings: ollamaEmbeddings });

const MainScreen: React.FC = () => {
  const {
    query,
    // setQuery, // We'll use setTranscribedQuery for voice input
    response,
    loading,
    error,
    ask,
    // rag, // We get rag instance from useRAG if needed for addDocument etc.
  } = useRAG({
    llm: ollamaLLM,
    embeddings: ollamaEmbeddings,
    vectorStore: vectorStore, // Use the persisted vector store
  });

  const [transcribedQuery, setTranscribedQuery] = useState('');
  const [displayResponse, setDisplayResponse] = useState('');
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (response) {
      setDisplayResponse(response);
    }
  }, [response]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', `An error occurred: ${error.message || error}`);
      console.error("RAG Error:", error);
    }
  }, [error]);


  const handleSpeechEnd = useCallback(
    async (transcription: string) => {
      console.log('Final transcription:', transcription);
      setIsListening(false);
      if (transcription && transcription.trim() !== '') {
        setTranscribedQuery(transcription);
        // Automatically send to RAG
        console.log('Asking RAG with query:', transcription);
        setDisplayResponse(''); // Clear previous response
        await ask(transcription);
      } else {
        // Handle cases where transcription might be empty or only whitespace
        setTranscribedQuery('');
        // Optionally, inform the user that no speech was detected or it was unclear
        // Alert.alert("Info", "No speech detected or transcription was empty.");
      }
    },
    [ask]
  );

  const handleSpeechStart = useCallback(() => {
    setIsListening(true);
    setTranscribedQuery(''); // Clear previous query
    setDisplayResponse(''); // Clear previous response
  }, []);


  // Manual query for testing if needed
  // const handleManualQuery = async () => {
  //   if (transcribedQuery.trim() !== '') {
  //     setDisplayResponse('');
  //     await ask(transcribedQuery);
  //   }
  // };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Text style={styles.title}>Local AI Assistant</Text>

        <View style={styles.queryContainer}>
          <Text style={styles.label}>Your Query:</Text>
          <TextInput
            style={styles.textInput}
            value={transcribedQuery}
            onChangeText={setTranscribedQuery} // Allow manual editing
            placeholder={isListening ? "Listening..." : "Press button to speak or type here"}
            multiline
            editable={!loading && !isListening}
          />
        </View>

        <ListenButton
          onSpeechEnd={handleSpeechEnd}
          onSpeechStart={handleSpeechStart}
          isProcessing={loading}
        />

        {/* Optional: Manual send button if you want to type and send */}
        {/* <TouchableOpacity style={styles.sendButton} onPress={handleManualQuery} disabled={loading || isListening}>
          <Text style={styles.sendButtonText}>Send Manual Query</Text>
        </TouchableOpacity> */}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>AI is thinking...</Text>
          </View>
        )}

        <View style={styles.responseContainer}>
          <Text style={styles.label}>AI Response:</Text>
          <ScrollView style={styles.responseScrollView}>
            <Text style={styles.responseText}>{displayResponse}</Text>
          </ScrollView>
        </View>
        {error && <Text style={styles.errorText}>Error: {error.message || JSON.stringify(error)}</Text>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between', // Distribute space
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  queryContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#555',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDDDDD',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top', // For Android
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
  },
  responseContainer: {
    flex: 1, // Allow response to take more space
    marginTop: 15,
    marginBottom: 20, // Add some bottom margin
  },
  responseScrollView: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDDDDD',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100, // Ensure it has some height
  },
  responseText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  // Optional send button style
  // sendButton: {
  //   backgroundColor: '#007AFF',
  //   padding: 15,
  //   borderRadius: 8,
  //   alignItems: 'center',
  //   marginTop: 10,
  // },
  // sendButtonText: {
  //   color: 'white',
  //   fontSize: 16,
  //   fontWeight: 'bold',
  // },
});

export default MainScreen;
