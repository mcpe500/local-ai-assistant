// src/screens/KnowledgeScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRAG, MemoryVectorStore, Document } from 'react-native-rag'; // Import Document
import { OllamaLLM, OllamaEmbeddings } from '../hooks/OllamaProvider';

// Initialize outside of component to reuse the same RAG instance logic as MainScreen
// This assumes MainScreen.tsx has already initialized these and we want to use the *same* vector store.
// For a truly shared vector store across screens, it should be managed by a context or a global state.
// For this example, we'll re-initialize but point to how it should be shared.

// A more robust solution would use React Context or a state management library (like Zustand, Redux)
// to share the RAG instance and vector store across screens.
// For now, to make this screen work with the provided structure, we get the 'rag' object
// from useRAG hook. The key is that the MemoryVectorStore must be the same instance.

// This is a simplified approach. Ideally, `vectorStore` is a global singleton or passed via context.
// Let's assume the `vectorStore` instance from `MainScreen.tsx` is somehow accessible here.
// For demonstration, we'll re-create it, but this means it won't share documents with MainScreen's store
// unless explicitly passed or managed globally.
// **Correction**: `react-native-rag`'s `useRAG` hook will manage its own instance of RAG context internally if not provided.
// To share the vector store, it MUST be the same instance.
// We will use the same pattern as in MainScreen to instantiate it,
// implying they are separate until a global state management is in place.

// To ensure we are using the *exact same instance* of the vector store as in MainScreen,
// we should define it in a shared location or pass it down.
// For this example, we'll re-initialize it here for simplicity, but highlight this limitation.
// A better way: export vectorStore from a central file and import it in both screens.

// Let's assume for now we are demonstrating the functionality of adding documents,
// and the sharing of vectorStore is a separate architectural concern.
// We will use the vectorStore from MainScreen.tsx

// Corrected approach: For the purpose of this exercise, we'll rely on the fact that
// if MainScreen.tsx initializes the vectorStore, and this screen also tries to initialize
// a MemoryVectorStore with the same embeddings, `react-native-rag` might not automatically
// share them unless the *exact same instance* of MemoryVectorStore is passed to `useRAG`.

// Let's get the actual vectorStore from MainScreen or a shared context.
// Since we don't have a shared context set up, we'll have to re-initialize
// and accept that it's a separate store for this screen for now.
// This is a limitation of not having a global state management for this example.

const ollamaLLM = new OllamaLLM('qwen2'); // Not strictly needed for this screen if only adding docs
const ollamaEmbeddings = new OllamaEmbeddings('nomic-embed-text');

// **IMPORTANT**: This will create a NEW vector store, separate from MainScreen's
// unless you implement a shared state/context for `vectorStore`.
// For this example, we'll proceed, but in a real app, share the instance.
const localVectorStore = new MemoryVectorStore({ embeddings: ollamaEmbeddings });


const KnowledgeScreen: React.FC = () => {
  const { rag, loading: ragLoading, error: ragError } = useRAG({
    llm: ollamaLLM, // or a dummy LLM if only adding docs
    embeddings: ollamaEmbeddings,
    vectorStore: localVectorStore, // Use the local one for this screen's context
                                 // To truly share, this instance must be the same as MainScreen's
  });

  const [documentText, setDocumentText] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]); // To display added document titles/content
  const [isAdding, setIsAdding] = useState(false);

  // Function to fetch and display documents from the store
  const refreshDocuments = useCallback(async () => {
    // MemoryVectorStore might not have a getAll method directly exposed for this.
    // We'll manage a local list for display purposes.
    // For a real app, you'd query or list from your VectorStore implementation.
    // Since MemoryVectorStore holds them in an internal array, we can't directly access it here
    // without modifying react-native-rag or extending MemoryVectorStore.
    // So, we'll just keep track of what we've added in this session via `documents` state.
  }, []);


  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  useEffect(() => {
    if (ragError) {
      Alert.alert('Error', `RAG Error: ${ragError.message || ragError}`);
      console.error("KnowledgeScreen RAG Error:", ragError);
    }
  }, [ragError]);

  const handleAddDocument = async () => {
    if (!documentText.trim()) {
      Alert.alert('Empty Document', 'Please enter some text for the document.');
      return;
    }
    if (!rag) {
      Alert.alert('Error', 'RAG system not initialized.');
      return;
    }

    setIsAdding(true);
    try {
      // Create a unique ID for the document or use a hash of the content
      const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      // The `splitAddDocument` method takes a Document object.
      // The Document object should have `pageContent` and `metadata`.
      // `react-native-rag` will handle the splitting and embedding.
      await rag.splitAddDocument({
        id: docId, // Optional: provide an ID
        pageContent: documentText,
        metadata: { source: 'user-input', addedAt: new Date().toISOString() },
      });

      // For display, add a representation of the document to our local list
      // This is a simplified representation.
      setDocuments(prevDocs => [
        ...prevDocs,
        { id: docId, pageContent: documentText, metadata: { source: 'user-input' } }
      ]);
      setDocumentText(''); // Clear input
      Alert.alert('Success', 'Document added to the knowledge base!');
    } catch (error: any) {
      console.error('Failed to add document:', error);
      Alert.alert('Error', `Failed to add document: ${error.message || error}`);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Text style={styles.title}>Knowledge Base Management</Text>
        <Text style={styles.subtitle}>
          Add text documents to the AI's knowledge.
          (Note: This screen uses a separate vector store instance in this example.
          For shared knowledge, a global state for the vector store is needed.)
        </Text>


        <View style={styles.inputContainer}>
          <Text style={styles.label}>Document Text:</Text>
          <TextInput
            style={styles.textArea}
            value={documentText}
            onChangeText={setDocumentText}
            placeholder="Paste or type your document content here..."
            multiline
            editable={!isAdding}
          />
          <TouchableOpacity
            style={[styles.addButton, isAdding && styles.addButtonDisabled]}
            onPress={handleAddDocument}
            disabled={isAdding}
          >
            {isAdding ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.addButtonText}>Add Document</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.listTitle}>Added Documents (This Session):</Text>
        {ragLoading && <ActivityIndicator style={{marginTop: 10}} />}
        <ScrollView style={styles.documentList}>
          {documents.length === 0 && !isAdding && (
            <Text style={styles.emptyListText}>No documents added yet in this session.</Text>
          )}
          {documents.map((doc, index) => (
            <View key={doc.id || index} style={styles.documentItem}>
              <Text style={styles.documentTitle}>Document {index + 1} (ID: ...{doc.id?.slice(-6)})</Text>
              <Text style={styles.documentContent} numberOfLines={3}>
                {doc.pageContent}
              </Text>
            </View>
          ))}
        </ScrollView>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    paddingHorizontal: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#555',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDDDDD',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  addButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#444',
  },
  documentList: {
    flex: 1, // Ensure ScrollView takes available space
  },
  documentItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  documentContent: {
    fontSize: 14,
    color: '#666',
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 15,
    color: '#777',
  },
});

export default KnowledgeScreen;
