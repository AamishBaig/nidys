import { useState, useCallback, useMemo } from 'react';
import { useFirebaseStorage } from './useFirebaseStorage';
import { MediaItem, MediaFolder, MediaFile, InitialMediaNode, InitialMediaFolder, InitialMediaFile } from '../types';
import { INITIAL_MEDIA_LIBRARY } from '../constants';

const normalizeMediaLibrary = (node: InitialMediaNode, parentId: string | null = null): [Map<string, MediaItem>, Map<string, string>] => {
  const items = new Map<string, MediaItem>();
  const imageData = new Map<string, string>();

  const traverse = (currentNode: InitialMediaNode, currentParentId: string | null) => {
    if (currentNode.type === 'folder') {
      const folderNode = currentNode as InitialMediaFolder;
      const childIds = folderNode.children.map(child => child.id);
      items.set(folderNode.id, {
        id: folderNode.id,
        name: folderNode.name,
        type: 'folder',
        children: childIds,
        parentId: currentParentId,
      });
      folderNode.children.forEach(child => traverse(child, folderNode.id));
    } else {
      const fileNode = currentNode as InitialMediaFile;
      items.set(fileNode.id, {
        id: fileNode.id,
        name: fileNode.name,
        type: 'file',
        mimeType: fileNode.mimeType,
        parentId: currentParentId,
      });
      if (fileNode.data) {
        imageData.set(fileNode.id, fileNode.data);
      }
    }
  };

  traverse(node, parentId);
  return [items, imageData];
};

export const useMediaManager = () => {
  const { items, imageMap, loading, addItem: fbAddItem, addFolder: fbAddFolder, renameItem: fbRenameItem, deleteItem: fbDeleteItem, moveItem: fbMoveItem, duplicateItem: fbDuplicateItem } = useFirebaseStorage();

  const getItem = useCallback((id: string) => items.get(id), [items]);

  const getFolderContents = useCallback((folderId: string) => {
    const folder = items.get(folderId);
    if (folder?.type === 'folder') {
      return folder.children.map(id => items.get(id)).filter((item): item is MediaItem => !!item);
    }
    return [];
  }, [items]);

  // Wrapper functions to match original API
  const addItem = useCallback((item: Omit<MediaFile, 'parentId'>, data: string, parentId: string) => {
    fbAddItem(item, data, parentId);
  }, [fbAddItem]);

  const addFolder = useCallback((folder: Omit<MediaFolder, 'parentId' | 'children'>, parentId: string) => {
    fbAddFolder(folder, parentId);
  }, [fbAddFolder]);

  const renameItem = useCallback((id: string, newName: string) => {
    fbRenameItem(id, newName);
  }, [fbRenameItem]);

  const deleteItem = useCallback((id: string) => {
    fbDeleteItem(id);
  }, [fbDeleteItem]);

  const moveItem = useCallback((itemId: string, newParentId: string) => {
    fbMoveItem(itemId, newParentId);
  }, [fbMoveItem]);

  const duplicateItem = useCallback((id: string) => {
    fbDuplicateItem(id);
  }, [fbDuplicateItem]);

  return {
    items,
    imageMap,
    loading,
    getItem,
    getFolderContents,
    addItem,
    addFolder,
    renameItem,
    deleteItem,
    moveItem,
    duplicateItem
  };
};
