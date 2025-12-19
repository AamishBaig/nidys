import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';

const reviver = (key: string, value: any) => {
  if (typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
};

const replacer = (key: string, value: any) => {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()),
    };
  } else {
    return value;
  }
};

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  onSave?: () => void,
// FIX: Use imported Dispatch and SetStateAction types instead of React.Dispatch
): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item, reviver) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    try {
      const valueToStoreString = JSON.stringify(storedValue, replacer);
      window.localStorage.setItem(key, valueToStoreString);
      onSaveRef.current?.();
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
        // FIX: Instead of using alert(), just log the error
        // In a sandboxed environment, alert() doesn't work anyway
        console.error('LOCAL STORAGE FULL: Could not save data. Your changes will not be persisted.');
        
        // Optional: You could emit a custom event that your app can listen to and show a custom notification
        const event = new CustomEvent('localStorageQuotaExceeded', {
          detail: { key, error }
        });
        window.dispatchEvent(event);
      }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}