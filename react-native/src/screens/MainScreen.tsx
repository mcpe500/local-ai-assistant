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
  TouchableOpacity,
} from 'react-native';
import { useVectorStore } from '../contexts/VectorStoreContext';
import ListenButton from '../components/ListenButton';

const MainScreen: React.FC = () => {
  const {
    activeStoreName,
    // activeStoreInstance, // We get RAG via getActiveRAGInstance
    getActiveRAGInstance,
    saveActiveStore,
    isLoading: isContextLoading, // Loading from context (e.g., switching stores)
  } = useVectorStore();

  const [transcribedQuery, setTranscribedQuery] = useState('');
  const [displayResponse, setDisplayResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessingQuery, setIsProcessingQuery] = useState(false); // Local loading for RAG ask
  const [ragError, setRagError] = useState<Error | null>(null);

  // Memoize RAG instance to avoid re-creating it on every render if not necessary
  const rag = React.useMemo(() => getActiveRAGInstance(), [getActiveRAGInstance, activeStoreName]);

  useEffect(() => {
    // Clear chat when active store changes
    setDisplayResponse('');
    setTranscribedQuery('');
    setRagError(null);
  }, [activeStoreName]);

  const handleAskQuery = async (queryText: string) => {
    if (!rag) {
      Alert.alert(
        'No Active Knowledge Base',
        'Please select or create a knowledge base in Settings.'
      );
      return;
    }
    if (!queryText.trim()) {
      Alert.alert('Empty Query', 'Please enter or speak a query.');
      return;
    }

    setIsProcessingQuery(true);
    setRagError(null);
    setDisplayResponse(''); // Clear previous response

    try {
      console.log(`Asking RAG (${activeStoreName}): "${queryText}"`);
      const aiResponse = await rag.ask(queryText);
      setDisplayResponse(aiResponse || 'AI returned no specific response.');

      // Add query and response to RAG as documents
      console.log('Adding chat interaction to knowledge base...');
      const userQueryDoc = {
        pageContent: `User: ${queryText}`,
        metadata: { type: 'user_query', timestamp: new Date().toISOString(), source: 'chat' },
      };
      const aiResponseDoc = {
        pageContent: `AI: ${aiResponse}`,
        metadata: { type: 'ai_response', timestamp: new Date().toISOString(), source: 'chat' },
      };

      await rag.splitAddDocument(userQueryDoc);
      await rag.splitAddDocument(aiResponseDoc);

      await saveActiveStore();
      console.log('Chat interaction added and knowledge base saved.');

    } catch (error: any) {
      console.error('Error during RAG query or saving chat:', error);
      setRagError(error);
      const errorMessage = error.message || 'Failed to get response or save chat interaction.';
      setDisplayResponse(`Error: ${errorMessage}`);
      Alert.alert('RAG Error', `An error occurred: ${errorMessage}`);
    } finally {
      setIsProcessingQuery(false);
    }
  };

  const handleSpeechEnd = useCallback(
    async (transcription: string) => {
      setIsListening(false);
      setTranscribedQuery(transcription); // Set text input with transcription
      if (transcription && transcription.trim() !== '') {
        await handleAskQuery(transcription);
      } else {
        // Alert.alert('Info', 'No speech detected or transcription was empty.');
      }
    },
    [rag, saveActiveStore] // Dependencies
  );

  const handleSpeechStart = useCallback(() => {
    setIsListening(true);
    // Do not clear transcribedQuery here, let user see and confirm/edit if needed
    setDisplayResponse(''); // Clear previous AI response
    setRagError(null);
  }, []);

  const handleManualSend = () => {
    if (transcribedQuery.trim() !== '') {
      handleAskQuery(transcribedQuery);
    } else {
      Alert.alert('Empty Query', 'Please type a query to send.');
    }
  };

  const overallLoading = isContextLoading || isProcessingQuery;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Text style={styles.title}>Local AI Assistant</Text>
        {activeStoreName && <Text style={styles.activeStoreInfo}>KB: {activeStoreName}</Text>}
        {!activeStoreName && !isContextLoading && (
          <Text style={styles.activeStoreInfoError}>No Knowledge Base selected. Go to Settings.</Text>
        )}

        <View style={styles.queryContainer}>
          <Text style={styles.label}>Your Query:</Text>
          <TextInput
            style={styles.textInput}
            value={transcribedQuery}
            onChangeText={setTranscribedQuery}
            placeholder={isListening ? 'Listening...' : 'Press button to speak or type here'}
            multiline
            editable={!overallLoading && !isListening}
          />
        </View>

        <ListenButton
          onSpeechEnd={handleSpeechEnd}
          onSpeechStart={handleSpeechStart}
          isProcessing={overallLoading || isListening} // Show processing if overall is loading OR actively listening
        />

        <TouchableOpacity
          style={[styles.sendButton, (overallLoading || isListening) && styles.buttonDisabled]}
          onPress={handleManualSend}
          disabled={overallLoading || isListening}
        >
          <Text style={styles.sendButtonText}>Send Typed Query</Text>
        </TouchableOpacity>

        {overallLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>{isContextLoading ? 'Knowledge base loading...' : 'AI is thinking...'}</Text>
          </View>
        )}

        <View style={styles.responseContainer}>
          <Text style={styles.label}>AI Response:</Text>
          <ScrollView style={styles.responseScrollView}>
            <Text style={styles.responseText}>{displayResponse}</Text>
          </ScrollView>
        </View>
        {ragError && !isProcessingQuery && <Text style={styles.errorText}>Error: {ragError.message || JSON.stringify(ragError)}</Text>}
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
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10, // Reduced margin
    color: '#333',
  },
  activeStoreInfo: {
    textAlign: 'center',
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  activeStoreInfoError: {
    textAlign: 'center',
    fontSize: 14,
    color: 'red',
    marginBottom: 10,
    fontWeight: 'bold',
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
    textAlignVertical: 'top',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 10, // Reduced margin
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
  },
  responseContainer: {
    flex: 1,
    marginTop: 15,
    marginBottom: 10, // Reduced margin
  },
  responseScrollView: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDDDDD',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
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
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10, // Added margin
    marginBottom: 10,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
  },
});

export default MainScreen;
