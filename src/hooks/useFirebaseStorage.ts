// hooks/useFirebaseStorage.ts
import { useState, useEffect, useCallback } from 'react';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, setDoc, updateDoc, deleteDoc, collection, getDocs, onSnapshot, query } from 'firebase/firestore';
import { storage, db } from '../firebase.config';
import { MediaItem, MediaFile, MediaFolder } from '../types';

const MEDIA_COLLECTION = 'media';

export const useFirebaseStorage = () => {
  const [items, setItems] = useState<Map<string, MediaItem>>(new Map());
  const [imageMap, setImageMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  // Real-time listener for media items
  useEffect(() => {
    const q = query(collection(db, MEDIA_COLLECTION));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newItems = new Map<string, MediaItem>();
        const newImageMap = new Map<string, string>();

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          
          if (data.type === 'folder') {
            newItems.set(doc.id, {
              id: doc.id,
              name: data.name,
              type: 'folder',
              children: data.children || [],
              parentId: data.parentId || null,
            } as MediaFolder);
          } else {
            newItems.set(doc.id, {
              id: doc.id,
              name: data.name,
              type: 'file',
              mimeType: data.mimeType || 'image/png',
              parentId: data.parentId || null,
            } as MediaFile);
            
            // Add to imageMap if downloadURL exists
            if (data.downloadURL) {
              newImageMap.set(doc.id, data.downloadURL);
            }
          }
        });

        // Ensure root folder exists
        if (!newItems.has('root')) {
          const rootFolder: MediaFolder = {
            id: 'root',
            name: 'Media Library',
            type: 'folder',
            children: [],
            parentId: null,
          };
          newItems.set('root', rootFolder);
          
          // Create root in Firebase
          setDoc(doc(db, MEDIA_COLLECTION, 'root'), {
            name: 'Media Library',
            type: 'folder',
            children: [],
            parentId: null,
          }).catch(console.error);
        }

        setItems(newItems);
        setImageMap(newImageMap);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading media:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Add file - same signature as useIndexedDBStorage
  const addItem = useCallback(
    async (item: Omit<MediaFile, 'parentId'>, data: string, parentId: string) => {
      try {
        // Upload to Firebase Storage
        const storagePath = `media/${item.id}`;
        const storageRef = ref(storage, storagePath);
        await uploadString(storageRef, data, 'data_url');
        
        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);

        // Save metadata to Firestore
        await setDoc(doc(db, MEDIA_COLLECTION, item.id), {
          name: item.name,
          type: 'file',
          mimeType: item.mimeType,
          parentId,
          downloadURL,
          storagePath,
        });

        // Update parent's children
        const parent = items.get(parentId);
        if (parent && parent.type === 'folder') {
          await updateDoc(doc(db, MEDIA_COLLECTION, parentId), {
            children: [...parent.children, item.id],
          });
        }
      } catch (error) {
        console.error('Error adding item:', error);
        throw error;
      }
    },
    [items]
  );

  // Add folder - same signature as useIndexedDBStorage
  const addFolder = useCallback(
    async (folder: Omit<MediaFolder, 'parentId' | 'children'>, parentId: string) => {
      try {
        // Create folder in Firestore
        await setDoc(doc(db, MEDIA_COLLECTION, folder.id), {
          name: folder.name,
          type: 'folder',
          children: [],
          parentId,
        });

        // Update parent's children
        const parent = items.get(parentId);
        if (parent && parent.type === 'folder') {
          await updateDoc(doc(db, MEDIA_COLLECTION, parentId), {
            children: [...parent.children, folder.id],
          });
        }
      } catch (error) {
        console.error('Error adding folder:', error);
        throw error;
      }
    },
    [items]
  );

  // Rename item - same signature as useIndexedDBStorage
  const renameItem = useCallback(async (id: string, newName: string) => {
    try {
      await updateDoc(doc(db, MEDIA_COLLECTION, id), { name: newName });
    } catch (error) {
      console.error('Error renaming item:', error);
      throw error;
    }
  }, []);

  // Delete item - same signature as useIndexedDBStorage
  const deleteItem = useCallback(
    async (id: string) => {
      if (id === 'root') return;

      const itemToDelete = items.get(id);
      if (!itemToDelete) return;

      try {
        // Collect all IDs to delete
        const allIdsToDelete = new Set<string>();
        const queue = [id];

        while (queue.length > 0) {
          const currentId = queue.shift()!;
          allIdsToDelete.add(currentId);
          const item = items.get(currentId);
          if (item?.type === 'folder') {
            item.children.forEach((childId) => queue.push(childId));
          }
        }

        // Delete from Storage and Firestore
        for (const deleteId of allIdsToDelete) {
          const item = items.get(deleteId);
          
          // Delete from Storage if file
          if (item?.type === 'file') {
            const storagePath = `media/${deleteId}`;
            const storageRef = ref(storage, storagePath);
            await deleteObject(storageRef).catch(() => {});
          }
          
          // Delete from Firestore
          await deleteDoc(doc(db, MEDIA_COLLECTION, deleteId));
        }

        // Update parent's children
        const parentId = itemToDelete.parentId;
        if (parentId) {
          const parent = items.get(parentId);
          if (parent && parent.type === 'folder') {
            await updateDoc(doc(db, MEDIA_COLLECTION, parentId), {
              children: parent.children.filter((childId) => childId !== id),
            });
          }
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        throw error;
      }
    },
    [items]
  );

  // Move item - same signature as useIndexedDBStorage
  const moveItem = useCallback(
    async (itemId: string, newParentId: string) => {
      const item = items.get(itemId);
      const oldParentId = item?.parentId;
      const newParent = items.get(newParentId);

      if (!item || !oldParentId || !newParent || newParent.type !== 'folder' || itemId === newParentId) return;

      // Check for circular reference
      let currentParent = newParent;
      while (currentParent.parentId) {
        if (currentParent.parentId === itemId) return;
        const parentItem = items.get(currentParent.parentId);
        if (!parentItem || parentItem.type !== 'folder') break;
        currentParent = parentItem;
      }

      try {
        // Update item's parent
        await updateDoc(doc(db, MEDIA_COLLECTION, itemId), { parentId: newParentId });

        // Update old parent's children
        const oldParent = items.get(oldParentId);
        if (oldParent && oldParent.type === 'folder') {
          await updateDoc(doc(db, MEDIA_COLLECTION, oldParentId), {
            children: oldParent.children.filter((id) => id !== itemId),
          });
        }

        // Update new parent's children
        await updateDoc(doc(db, MEDIA_COLLECTION, newParentId), {
          children: [...newParent.children, itemId],
        });
      } catch (error) {
        console.error('Error moving item:', error);
        throw error;
      }
    },
    [items]
  );

  // Duplicate item - same signature as useIndexedDBStorage
  const duplicateItem = useCallback(
    async (id: string) => {
      const itemToDuplicate = items.get(id);
      if (!itemToDuplicate || itemToDuplicate.type === 'folder' || !itemToDuplicate.parentId) return;

      const newId = `file-${Date.now()}`;
      const newName = `${itemToDuplicate.name} (copy)`;
      const originalData = imageMap.get(id);

      if (originalData) {
        await addItem(
          { id: newId, name: newName, type: 'file', mimeType: itemToDuplicate.mimeType },
          originalData,
          itemToDuplicate.parentId
        );
      }
    },
    [items, imageMap, addItem]
  );

  return {
    items,
    imageMap,
    loading,
    addItem,
    addFolder,
    renameItem,
    deleteItem,
    moveItem,
    duplicateItem,
  };
};
