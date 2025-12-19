// useIndexedDBStorage.ts
// Persistent storage using IndexedDB - survives localStorage clears

const DB_NAME = 'MenuAppStorage';
const DB_VERSION = 1;
const STORE_NAME = 'mediaFiles';

class IndexedDBStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async set(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ id: key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(key: string): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  async remove(key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const indexedDBStorage = new IndexedDBStorage();

// Hook to use IndexedDB storage with React state
// Fix: Import Dispatch and SetStateAction to correctly type the hook's return signature.
import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';

export function useIndexedDBStorage<T>(
  key: string,
  initialValue: T,
  onSave?: () => void
): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // Load initial value from IndexedDB
  useEffect(() => {
    let isMounted = true;

    async function loadValue() {
      try {
        await indexedDBStorage.init();
        const value = await indexedDBStorage.get(key);
        
        if (isMounted) {
          if (value !== undefined) {
            // Restore Maps from serialized format
            if (value && typeof value === 'object' && value.dataType === 'Map') {
              setStoredValue(new Map(value.value) as T);
            } else {
              setStoredValue(value);
            }
          }
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error loading from IndexedDB:', error);
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    }

    loadValue();

    return () => {
      isMounted = false;
    };
  }, [key]);

  // Save to IndexedDB whenever value changes
  useEffect(() => {
    if (!isInitialized) return;

    async function saveValue() {
      try {
        // Serialize Maps for storage
        let valueToStore = storedValue;
        if (storedValue instanceof Map) {
          valueToStore = {
            dataType: 'Map',
            value: Array.from(storedValue.entries())
          } as any;
        }

        await indexedDBStorage.set(key, valueToStore);
        onSaveRef.current?.();
      } catch (error) {
        console.error('Error saving to IndexedDB:', error);
      }
    }

    saveValue();
  }, [key, storedValue, isInitialized]);

  return [storedValue, setStoredValue];
}