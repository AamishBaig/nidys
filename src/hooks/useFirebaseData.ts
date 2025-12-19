// hooks/useFirebaseData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase.config';

// Wrapper type for Firestore documents
interface FirebaseDocument<T> {
  value: T;
}

export function useFirebaseData<T>(
  collection: string,
  documentId: string,
  initialValue: T,
  onSave?: () => void
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [data, setData] = useState(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);
  const updateTimeoutRef = useRef<number | null>(null);

  // Real-time listener - syncs data from Firebase
  useEffect(() => {
    const docRef = doc(db, collection, documentId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          // ✅ FIXED: Extract value from wrapper object
          const docData = snapshot.data() as FirebaseDocument<T>;
          setData(docData.value);
        } else {
          // ✅ FIX: Keep initial value visible while creating document
          setData(initialValue);
          // Document doesn't exist, create it with initial value wrapped in object
          setDoc(docRef, { value: initialValue }).catch(console.error);
        }
        setIsInitialized(true);
      },
      (error) => {
        console.error(`Error listening to ${collection}/${documentId}:`, error);
        // ✅ FIX: Keep initial value on error
        setData(initialValue);
        setIsInitialized(true);
      }
    );

    return () => unsubscribe();
  }, [collection, documentId, initialValue]);

  // Custom setState that syncs to Firebase
  const setDataAndSync: React.Dispatch<React.SetStateAction<T>> = useCallback(
    (value: T | ((prev: T) => T)) => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(data) : value;
      setData(newValue);

      // Only sync to Firebase after initialization
      if (isInitialized) {
        // Debounce Firebase writes
        if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = window.setTimeout(() => {
          const docRef = doc(db, collection, documentId);
          // ✅ FIXED: Always use setDoc with merge, wrapped in object
          setDoc(docRef, { value: newValue }, { merge: true })
            .then(() => {
              onSave?.();
            })
            .catch((error) => {
              console.error(`Error updating ${collection}/${documentId}:`, error);
            });
        }, 300); // 300ms debounce
      }
    },
    [collection, documentId, data, isInitialized, onSave]
  );

  return [data, setDataAndSync];
}
