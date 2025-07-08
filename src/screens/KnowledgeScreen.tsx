// src/screens/KnowledgeScreen.tsx
import React, { useState, useEffect } from 'react';
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
  Keyboard,
} from 'react-native';
import { useVectorStore } from '../contexts/VectorStoreContext';
import { Document as RagDocumentInput } from 'react-native-rag'; // Type for document input

const KnowledgeScreen: React.FC = () => {
  const {
    activeStoreName,
    // activeStoreInstance, // RAG instance is preferred
    getActiveRAGInstance,
    saveActiveStore,
    isLoading: isContextLoading, // Loading from context (e.g., switching stores)
  } = useVectorStore();

  const [documentText, setDocumentText] = useState('');
  const [documentMetadata, setDocumentMetadata] = useState(''); // Simple string for metadata for now
  const [isAdding, setIsAdding] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<RagDocumentInput[]>([]);

  // Memoize RAG instance
  const rag = React.useMemo(() => getActiveRAGInstance(), [getActiveRAGInstance, activeStoreName]);

  useEffect(() => {
    // Clear fields when active store changes
    setDocumentText('');
    setDocumentMetadata('');
    setRecentlyAdded([]);
  }, [activeStoreName]);

  const handleAddDocument = async () => {
    if (!rag) {
      Alert.alert(
        'No Active Knowledge Base',
        'Please select or create a knowledge base in Settings to add documents.'
      );
      return;
    }
    if (!documentText.trim()) {
      Alert.alert('Empty Document', 'Please enter some text for the document.');
      return;
    }

    Keyboard.dismiss();
    setIsAdding(true);
    try {
      const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const metadata: Record<string, any> = {
        source: 'manual-entry',
        addedAt: new Date().toISOString(),
      };
      if (documentMetadata.trim()) {
        metadata.customInfo = documentMetadata.trim(); // Example of adding custom metadata
      }

      const newDocument: RagDocumentInput = {
        id: docId,
        pageContent: documentText,
        metadata: metadata,
      };

      // Use RAG instance to add document (handles splitting & embedding)
      await rag.splitAddDocument(newDocument);

      // Save the entire store after modification
      await saveActiveStore();

      setRecentlyAdded(prev => [newDocument, ...prev].slice(0, 5)); // Show last 5 added
      setDocumentText('');
      setDocumentMetadata('');
      Alert.alert('Success', `Document added to "${activeStoreName}" and knowledge base saved!`);
    } catch (error: any) {
      console.error('Failed to add document:', error);
      Alert.alert('Error', `Failed to add document: ${error.message || 'Unknown error'}`);
    } finally {
      setIsAdding(false);
    }
  };

  const overallLoading = isContextLoading || isAdding;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Text style={styles.title}>Add to Knowledge Base</Text>
        {activeStoreName ? (
          <Text style={styles.activeStoreInfo}>
            Adding to: <Text style={{ fontWeight: 'bold' }}>{activeStoreName}</Text>
          </Text>
        ) : (
          <Text style={styles.activeStoreInfoError}>
            No Knowledge Base selected. Go to Settings to select or create one.
          </Text>
        )}

        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Document Text:</Text>
            <TextInput
              style={styles.textArea}
              value={documentText}
              onChangeText={setDocumentText}
              placeholder="Paste or type your document content here..."
              multiline
              editable={!overallLoading && !!activeStoreName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Optional Metadata (e.g., source, category):</Text>
            <TextInput
              style={styles.metadataInput}
              value={documentMetadata}
              onChangeText={setDocumentMetadata}
              placeholder="Enter simple metadata text"
              editable={!overallLoading && !!activeStoreName}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.addButton,
              (overallLoading || !activeStoreName) && styles.addButtonDisabled,
            ]}
            onPress={handleAddDocument}
            disabled={overallLoading || !activeStoreName}
          >
            {isAdding ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.addButtonText}>Add Document to KB</Text>
            )}
          </TouchableOpacity>

          {isContextLoading && <ActivityIndicator style={{ marginVertical: 10 }} />}

          <Text style={styles.listTitle}>Recently Added to "{activeStoreName || 'N/A'}" (Max 5):</Text>
          {recentlyAdded.length === 0 && !isAdding && (
            <Text style={styles.emptyListText}>No documents added in this session yet.</Text>
          )}
          {recentlyAdded.map((doc) => (
            <View key={doc.id} style={styles.documentItem}>
              <Text style={styles.documentTitle}>ID: ...{doc.id?.slice(-6)}</Text>
              <Text style={styles.documentContent} numberOfLines={2}>
                {doc.pageContent}
              </Text>
              {doc.metadata?.customInfo && (
                <Text style={styles.documentMeta}>Meta: {String(doc.metadata.customInfo)}</Text>
              )}
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
    marginBottom: 10, // Adjusted
    color: '#333',
  },
  activeStoreInfo: {
    textAlign: 'center',
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 15, // Adjusted
    fontWeight: 'bold',
  },
  activeStoreInfoError: {
    textAlign: 'center',
    fontSize: 14,
    color: 'red',
    marginBottom: 15, // Adjusted
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 15, // Adjusted
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
    minHeight: 120, // Adjusted
    textAlignVertical: 'top',
  },
  metadataInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDDDDD',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 50, // Adjusted
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10, // Adjusted
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
    marginTop: 25, // Adjusted
    marginBottom: 10,
    color: '#444',
  },
  documentItem: {
    backgroundColor: '#FFFFFF',
    padding: 12, // Adjusted
    borderRadius: 8,
    marginBottom: 10,
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  documentTitle: {
    fontSize: 14, // Adjusted
    fontWeight: 'bold',
    color: '#333',
  },
  documentContent: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  documentMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 15, // Adjusted
    fontSize: 15,
    color: '#777',
  },
});

export default KnowledgeScreen;
