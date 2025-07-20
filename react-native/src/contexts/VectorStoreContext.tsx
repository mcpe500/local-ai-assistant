// src/contexts/VectorStoreContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo, useCallback } from 'react';
import { MemoryVectorStore, RAG, Embeddings, LLM } from 'react-native-rag';
import { VectorStoreManager } from '../services/VectorStoreManager';
import { OllamaEmbeddings, OllamaLLM } from '../hooks/OllamaProvider'; // Assuming these are your custom providers

interface VectorStoreContextType {
  activeStoreName: string | null;
  activeStoreInstance: MemoryVectorStore | null;
  availableStores: string[];
  isLoading: boolean;
  vectorStoreManager: VectorStoreManager | null; // Expose manager for more direct operations if needed
  ollamaLLM: LLM; // Expose LLM
  ollamaEmbeddings: Embeddings; // Expose Embeddings

  selectStore: (name: string) => Promise<void>;
  createNewStore: (name: string) => Promise<void>;
  deleteStore: (name: string) => Promise<void>;
  refreshAvailableStores: () => Promise<void>;
  getActiveRAGInstance: () => RAG | null;
  saveActiveStore: () => Promise<void>;
  isStoreNameTaken: (name: string) => boolean;
}

const VectorStoreContext = createContext<VectorStoreContextType | undefined>(undefined);

interface VectorStoreProviderProps {
  children: ReactNode;
  // Pass instances of LLM and Embeddings to the provider
  llm: LLM;
  embeddings: Embeddings;
}

export const VectorStoreProvider: React.FC<VectorStoreProviderProps> = ({ children, llm, embeddings }) => {
  const [activeStoreName, setActiveStoreName] = useState<string | null>(null);
  const [activeStoreInstance, setActiveStoreInstance] = useState<MemoryVectorStore | null>(null);
  const [availableStores, setAvailableStores] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [vectorStoreManagerInstance, setVectorStoreManagerInstance] = useState<VectorStoreManager | null>(null);

  // Initialize VectorStoreManager with the passed embeddings
  useEffect(() => {
    const manager = new VectorStoreManager(embeddings);
    setVectorStoreManagerInstance(manager);
  }, [embeddings]);


  const refreshAvailableStores = useCallback(async () => {
    if (!vectorStoreManagerInstance) return;
    setIsLoading(true);
    try {
      const names = await vectorStoreManagerInstance.listStores();
      setAvailableStores(names);
    } catch (error) {
      console.error("Failed to refresh available stores:", error);
      setAvailableStores([]);
    } finally {
      setIsLoading(false);
    }
  }, [vectorStoreManagerInstance]);

  // Load available stores on mount
  useEffect(() => {
    if (vectorStoreManagerInstance) {
      refreshAvailableStores();
    }
  }, [vectorStoreManagerInstance, refreshAvailableStores]);

  const selectStore = async (name: string) => {
    if (!vectorStoreManagerInstance) return;
    if (name === activeStoreName) return; // Already active

    setIsLoading(true);
    try {
      const storeInstance = await vectorStoreManagerInstance.getStore(name);
      setActiveStoreInstance(storeInstance);
      setActiveStoreName(name);
      console.log(`Context: Store "${name}" selected.`);
    } catch (error) {
      console.error(`Failed to select store "${name}":`, error);
      // Optionally clear active store or handle error state
      setActiveStoreInstance(null);
      setActiveStoreName(null);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewStore = async (name: string) => {
    if (!vectorStoreManagerInstance) return;
    if (!name || name.trim() === "") {
        alert("Store name cannot be empty.");
        return;
    }
    if (availableStores.includes(name)) {
        alert(`Store name "${name}" already exists.`);
        return;
    }
    setIsLoading(true);
    try {
      const newStoreInstance = await vectorStoreManagerInstance.createStore(name);
      setActiveStoreInstance(newStoreInstance);
      setActiveStoreName(name);
      await refreshAvailableStores(); // Update list
      console.log(`Context: New store "${name}" created and selected.`);
    } catch (error) {
      console.error(`Failed to create new store "${name}":`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteStore = async (name: string) => {
    if (!vectorStoreManagerInstance) return;
    setIsLoading(true);
    try {
      await vectorStoreManagerInstance.deleteStore(name);
      if (activeStoreName === name) {
        setActiveStoreInstance(null);
        setActiveStoreName(null);
        // Optionally select another store or default
      }
      await refreshAvailableStores();
      console.log(`Context: Store "${name}" deleted.`);
    } catch (error) {
      console.error(`Failed to delete store "${name}":`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveActiveStore = async () => {
    if (!vectorStoreManagerInstance || !activeStoreName || !activeStoreInstance) {
      console.warn("No active store or manager to save.");
      return;
    }
    setIsLoading(true);
    try {
      await vectorStoreManagerInstance.saveStore(activeStoreName, activeStoreInstance);
      console.log(`Context: Active store "${activeStoreName}" saved.`);
    } catch (error) {
      console.error(`Failed to save active store "${activeStoreName}":`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActiveRAGInstance = (): RAG | null => {
    if (!activeStoreInstance || !llm || !embeddings) {
      // console.warn("Cannot create RAG instance: Missing active store, LLM, or embeddings.");
      return null;
    }
    return new RAG({
      llm: llm,
      embeddings: embeddings,
      vectorStore: activeStoreInstance,
    });
  };

  const isStoreNameTaken = (name: string): boolean => {
    return availableStores.includes(name);
  };


  const contextValue = useMemo(() => ({
    activeStoreName,
    activeStoreInstance,
    availableStores,
    isLoading,
    vectorStoreManager: vectorStoreManagerInstance,
    ollamaLLM: llm,
    ollamaEmbeddings: embeddings,
    selectStore,
    createNewStore,
    deleteStore,
    refreshAvailableStores,
    getActiveRAGInstance,
    saveActiveStore,
    isStoreNameTaken,
  }), [
    activeStoreName, activeStoreInstance, availableStores, isLoading, vectorStoreManagerInstance,
    llm, embeddings, selectStore, createNewStore, deleteStore, refreshAvailableStores,
    getActiveRAGInstance, saveActiveStore, isStoreNameTaken
  ]);


  return (
    <VectorStoreContext.Provider value={contextValue}>
      {children}
    </VectorStoreContext.Provider>
  );
};

export const useVectorStore = (): VectorStoreContextType => {
  const context = useContext(VectorStoreContext);
  if (context === undefined) {
    throw new Error('useVectorStore must be used within a VectorStoreProvider');
  }
  return context;
};
