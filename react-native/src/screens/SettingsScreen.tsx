// src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import { useVectorStore } from '../contexts/VectorStoreContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SettingsScreen: React.FC = () => {
  const {
    activeStoreName,
    availableStores,
    isLoading,
    selectStore,
    createNewStore,
    deleteStore,
    isStoreNameTaken,
  } = useVectorStore();

  const [newStoreName, setNewStoreName] = useState('');

  const handleCreateNewStore = async () => {
    const trimmedName = newStoreName.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Knowledge base name cannot be empty.');
      return;
    }
    if (isStoreNameTaken(trimmedName)) {
      Alert.alert('Error', `A knowledge base named "${trimmedName}" already exists.`);
      return;
    }
    Keyboard.dismiss();
    await createNewStore(trimmedName);
    setNewStoreName(''); // Clear input
  };

  const handleDeleteStore = (name: string) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete the knowledge base "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => await deleteStore(name),
        },
      ]
    );
  };

  const renderStoreItem = ({ item }: { item: string }) => (
    <View style={styles.storeItem}>
      <Text
        style={[
          styles.storeName,
          item === activeStoreName && styles.activeStoreName,
        ]}
      >
        {item}
        {item === activeStoreName && (
          <Text style={styles.activeIndicator}> (Active)</Text>
        )}
      </Text>
      <View style={styles.storeActions}>
        {item !== activeStoreName && (
          <TouchableOpacity
            style={[styles.actionButton, styles.selectButton]}
            onPress={() => selectStore(item)}
            disabled={isLoading}
          >
            <Icon name="check-circle-outline" size={22} color="#FFF" />
            <Text style={styles.actionButtonText}>Select</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteStore(item)}
          disabled={isLoading}
        >
          <Icon name="delete-outline" size={22} color="#FFF" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Manage Knowledge Bases</Text>

        {isLoading && <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />}

        <View style={styles.createSection}>
          <TextInput
            style={styles.input}
            placeholder="New knowledge base name"
            value={newStoreName}
            onChangeText={setNewStoreName}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.button, styles.createButton, isLoading && styles.buttonDisabled]}
            onPress={handleCreateNewStore}
            disabled={isLoading}
          >
            <Icon name="plus-circle-outline" size={20} color="#FFF" />
            <Text style={styles.buttonText}>Create New</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.listHeader}>Available Knowledge Bases:</Text>
        {availableStores.length === 0 && !isLoading ? (
          <Text style={styles.emptyListText}>No knowledge bases found. Create one to get started!</Text>
        ) : (
          <FlatList
            data={availableStores}
            renderItem={renderStoreItem}
            keyExtractor={(item) => item}
            style={styles.list}
          />
        )}
        {activeStoreName && !isLoading && (
            <Text style={styles.currentActiveText}>Currently active: <Text style={{fontWeight: 'bold'}}>{activeStoreName}</Text></Text>
        )}
      </View>
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
    marginBottom: 20,
    color: '#333',
  },
  loader: {
    marginVertical: 20,
  },
  createSection: {
    marginBottom: 25,
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  input: {
    backgroundColor: '#FFF',
    borderColor: '#DDD',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
    elevation: 2,
  },
  createButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  listHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    color: '#444',
  },
  list: {
    flexGrow: 0, // Important for FlatList within a ScrollView/View
  },
  storeItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'column', // Changed to column for better layout
    // alignItems: 'center', // Align items for column layout
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  storeName: {
    fontSize: 17,
    flex: 1, // Take available space
    color: '#333',
    marginBottom: 10, // Add margin for actions below
  },
  activeStoreName: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  activeIndicator: {
    fontStyle: 'italic',
    color: '#007AFF',
  },
  storeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align buttons to the right
    width: '100%', // Ensure actions take full width for alignment
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  selectButton: {
    backgroundColor: '#4CAF50', // Green
  },
  deleteButton: {
    backgroundColor: '#F44336', // Red
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 15,
    color: '#777',
  },
  currentActiveText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#333',
  }
});

export default SettingsScreen;
