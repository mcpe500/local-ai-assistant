// src/services/VectorStoreManager.ts
import { MemoryVectorStore, Embeddings } from 'react-native-rag';
import * as VectorStorePersister from '../lib/VectorStorePersister';

interface VectorStoreCache {
  [name: string]: MemoryVectorStore;
}

export class VectorStoreManager {
  private cache: VectorStoreCache = {};
  private embeddings: Embeddings;

  constructor(embeddings: Embeddings) {
    this.embeddings = embeddings;
  }

  /**
   * Retrieves a store from cache or loads/creates it.
   * If the store doesn't exist in AsyncStorage, a new empty one is created but NOT saved until explicitly done.
   * To create and save, use createStore.
   */
  async getStore(name: string): Promise<MemoryVectorStore> {
    if (this.cache[name]) {
      return this.cache[name];
    }

    // Try to load from persister
    const store = await VectorStorePersister.loadVectorStore(name, this.embeddings);
    this.cache[name] = store;
    return store;
  }

  /**
   * Saves the store using persister and updates cache.
   */
  async saveStore(name: string, storeInstance?: MemoryVectorStore): Promise<void> {
    const storeToSave = storeInstance || this.cache[name];
    if (!storeToSave) {
      throw new Error(`Store "${name}" not found in cache and no instance provided to save.`);
    }
    await VectorStorePersister.saveVectorStore(name, storeToSave);
    this.cache[name] = storeToSave; // Ensure cache is up-to-date
    console.log(`VectorStoreManager: Store "${name}" saved.`);
  }

  /**
   * Deletes from persister and cache.
   */
  async deleteStore(name: string): Promise<void> {
    await VectorStorePersister.deleteVectorStore(name);
    delete this.cache[name];
    console.log(`VectorStoreManager: Store "${name}" deleted.`);
  }

  /**
   * Returns list of store names from persister.
   */
  async listStores(): Promise<string[]> {
    return VectorStorePersister.listVectorStoreNames();
  }

  /**
   * Creates a new empty store, saves it, and adds to cache.
   * If a store with the same name already exists, it will be overwritten.
   */
  async createStore(name: string): Promise<MemoryVectorStore> {
    if (!name || name.trim() === "") {
      throw new Error("Store name cannot be empty.");
    }
    // Ensure the store is empty by creating a new one and loading it (which initializes it if not found)
    // then explicitly clear its vectors before first save if we want it truly empty.
    const newStore = new MemoryVectorStore({ embeddings: this.embeddings });
    (newStore as any).memoryVectors = []; // Ensure it's genuinely empty

    await VectorStorePersister.saveVectorStore(name, newStore); // Save the new empty store
    this.cache[name] = newStore;
    console.log(`VectorStoreManager: New empty store "${name}" created and saved.`);
    return newStore;
  }

  /**
   * Clears the internal cache. Useful if underlying storage might change externally.
   */
  clearCache(): void {
    this.cache = {};
  }

  /**
   * Re-initializes a store by loading it from disk, effectively discarding cached changes if not saved.
   * Useful if you suspect cache might be stale or want to revert to last saved state.
   */
  async reloadStore(name: string): Promise<MemoryVectorStore> {
    delete this.cache[name];
    return this.getStore(name);
  }
}

// Example of how this might be instantiated globally or passed via context setup
// import { OllamaEmbeddings } from '../hooks/OllamaProvider';
// const defaultEmbeddings = new OllamaEmbeddings(); // Or your chosen embeddings model
// export const globalVectorStoreManager = new VectorStoreManager(defaultEmbeddings);
