// hooks/useFirebaseData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase.config';

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

  useEffect(() => {
    const docRef = doc(db, collection, documentId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const docData = snapshot.data() as FirebaseDocument<T>;
          setData(docData.value);
        } else {
          // ✅ FIX: Keep initial value in UI while creating document
          setData(initialValue);
          // Create document in Firebase
          setDoc(docRef, { value: initialValue }).catch(console.error);
        }
        setIsInitialized(true);
      },
      (error) => {
        console.error(`Error listening to ${collection}/${documentId}:`, error);
        // ✅ FIX: On error, keep initial value
        setData(initialValue);
        setIsInitialized(true);
      }
    );

    return () => unsubscribe();
  }, [collection, documentId, initialValue]);

  const setDataAndSync: React.Dispatch<React.SetStateAction<T>> = useCallback(
    (value: T | ((prev: T) => T)) => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(data) : value;
      setData(newValue);

      if (isInitialized) {
        if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = window.setTimeout(() => {
          const docRef = doc(db, collection, documentId);
          setDoc(docRef, { value: newValue }, { merge: true })
            .then(() => {
              onSave?.();
            })
            .catch((error) => {
              console.error(`Error updating ${collection}/${documentId}:`, error);
            });
        }, 300);
      }
    },
    [collection, documentId, data, isInitialized, onSave]
  );

  return [data, setDataAndSync];
}
