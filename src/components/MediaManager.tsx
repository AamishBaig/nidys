import React, { useState, useContext, useRef, useCallback, DragEvent, useMemo } from 'react';
import Modal from './Modal';
import { MediaManagerContext } from '../context/MediaManagerContext';
import { AppContext } from '../context/AppContext';
import { MediaItem } from '../types';
import { FolderIcon, PhotoIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon, DocumentDuplicateIcon, ArrowUpOnSquareIcon, SparklesIcon, ChevronRightIcon } from './Icons';
import EditableField from './EditableField';
import ImageGenerator from './ImageGenerator';
import ConfirmDialog from './ConfirmDialog';
import PromptDialog from './PromptDialog';

const MediaManager: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { mediaManagerCallback, menuData, themes } = useContext(AppContext);
    const { items, imageMap, getFolderContents, getItem, addItem, addFolder, renameItem, deleteItem, moveItem, duplicateItem } = useContext(MediaManagerContext);
    
    const [currentFolderId, setCurrentFolderId] = useState('root');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
    const [isImageGeneratorOpen, setImageGeneratorOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; item: MediaItem | null }>({ 
        isOpen: false, 
        item: null 
    });
    const [showFolderPrompt, setShowFolderPrompt] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    const currentFolderContents = getFolderContents(currentFolderId);
    
    const breadcrumbs = useMemo(() => {
        const path = [];
        let current = getItem(currentFolderId);
        while (current) {
            path.unshift(current);
            current = current.parentId ? getItem(current.parentId) : null;
        }
        return path;
    }, [currentFolderId, getItem]);

    const handleFileSelect = (item: MediaItem) => {
        if (item.type === 'file') {
            mediaManagerCallback(item.id);
            onClose();
        }
    };
    
    const handleDeleteClick = useCallback((item: MediaItem) => {
        // Check if file is in use
        if (item.type === 'file') {
            const isUsed = 
                menuData.some(cat => cat.items.some(menuItem => 
                    menuItem.backgroundImageId === item.id || menuItem.foregroundImageId === item.id
                )) ||
                themes.some(theme => theme.backgroundImage === item.id);
            
            if (isUsed) {
                alert("This image is currently in use by a menu item or theme and cannot be deleted.");
                return;
            }
        }
        
        // Open confirmation dialog
        setDeleteConfirmation({ isOpen: true, item });
        setActiveDropdown(null);
    }, [menuData, themes]);

    const confirmDelete = useCallback(() => {
        if (deleteConfirmation.item) {
            deleteItem(deleteConfirmation.item.id);
        }
        setDeleteConfirmation({ isOpen: false, item: null });
    }, [deleteConfirmation.item, deleteItem]);


    const handleUpload = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        // FIX: Iterate directly over the FileList. This correctly types `file` as a File object.
        for (const file of files) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const newFile = {
                    id: `file-${Date.now()}-${Math.random()}`,
                    name: file.name,
                    type: 'file' as const,
                    mimeType: file.type,
                };
                addItem(newFile, event.target?.result as string, currentFolderId);
            };
            reader.readAsDataURL(file);
        }
        // Reset the input so the same file can be uploaded again
        e.target.value = '';
    };
    
    const handleCreateFolder = () => {
        setShowFolderPrompt(true);
    };

    const handleFolderCreate = (folderName: string) => {
        if (folderName) {
            const newFolder = {
                id: `folder-${Date.now()}`,
                name: folderName,
                type: 'folder' as const,
            };
            addFolder(newFolder, currentFolderId);
        }
    };

    const onDragStart = (e: DragEvent<HTMLDivElement>, item: MediaItem) => {
        e.dataTransfer.setData('application/json', JSON.stringify(item));
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const onDrop = (e: DragEvent<HTMLDivElement>, targetFolder: MediaItem) => {
        e.preventDefault();
        e.stopPropagation();
        if (targetFolder.type !== 'folder') return;
        
        const item = JSON.parse(e.dataTransfer.getData('application/json')) as MediaItem;
        if(item.id !== targetFolder.id) {
             moveItem(item.id, targetFolder.id);
        }
    };

    // Drop zone handlers for the main area (to drop back to current folder)
    const onDropZoneDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDraggingOver(true);
    };

    const onDropZoneDragLeave = (e: DragEvent<HTMLDivElement>) => {
        // Only set to false if we're leaving the drop zone itself, not a child element
        if (e.currentTarget === e.target) {
            setIsDraggingOver(false);
        }
    };

    const onDropZoneDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        
        const item = JSON.parse(e.dataTransfer.getData('application/json')) as MediaItem;
        // Only move if the item isn't already in the current folder
        if (item.parentId !== currentFolderId) {
            moveItem(item.id, currentFolderId);
        }
    };

    const renderItem = (item: MediaItem) => {
        const isRenaming = renamingItemId === item.id;
        return (
            <div
                key={item.id}
                draggable={!isRenaming}
                onDragStart={(e) => onDragStart(e, item)}
                onDragOver={item.type === 'folder' ? onDragOver : undefined}
                onDrop={item.type === 'folder' ? (e) => onDrop(e, item) : undefined}
                className="relative group cursor-pointer"
                onDoubleClick={() => item.type === 'folder' ? setCurrentFolderId(item.id) : handleFileSelect(item)}
            >
                <div className={`aspect-square flex flex-col items-center justify-center p-2 rounded-lg border-2 border-transparent group-hover:bg-gray-700 ${item.type === 'folder' ? 'bg-indigo-900/20' : 'bg-gray-800'}`}>
                    {item.type === 'folder' ? 
                        <FolderIcon className="w-16 h-16 text-indigo-400" /> :
                        <img src={imageMap.get(item.id)} alt={item.name} className="w-full h-full object-cover rounded-md" />
                    }
                </div>
                {isRenaming ? (
                     <EditableField 
                        value={item.name} 
                        onChange={(newName) => { renameItem(item.id, newName); setRenamingItemId(null); }} 
                        className="mt-2 text-center text-sm w-full bg-gray-600"
                    />
                ) : (
                    <p className="mt-2 text-center text-sm truncate" title={item.name}>{item.name}</p>
                )}
                 <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100">
                    <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === item.id ? null : item.id) }} className="p-1 bg-black/50 rounded-full">
                        <EllipsisVerticalIcon className="w-5 h-5" />
                    </button>
                    {activeDropdown === item.id && (
                        <div ref={dropdownRef} className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-20">
                            <button onClick={() => { setRenamingItemId(item.id); setActiveDropdown(null); }} className="w-full text-left flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-700"><PencilIcon className="w-4 h-4" /><span>Rename</span></button>
                            {item.type === 'file' && <button onClick={() => { duplicateItem(item.id); setActiveDropdown(null); }} className="w-full text-left flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-700"><DocumentDuplicateIcon className="w-4 h-4" /><span>Duplicate</span></button>}
                            <button onClick={() => handleDeleteClick(item)} className="w-full text-left flex items-center space-x-2 px-3 py-2 text-sm hover:bg-red-500/50 text-red-400"><TrashIcon className="w-4 h-4" /><span>Delete</span></button>
                        </div>
                    )}
                 </div>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Media Manager" className="w-full max-w-4xl h-[80vh]">
            <div className="h-full flex flex-col">
                <header className="flex-shrink-0 flex items-center justify-between pb-4 mb-4 border-b border-gray-700">
                    <nav className="flex items-center text-sm">
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={crumb.id}>
                                <button onClick={() => setCurrentFolderId(crumb.id)} className="hover:underline">{crumb.name}</button>
                                {index < breadcrumbs.length - 1 && <ChevronRightIcon className="w-4 h-4 mx-1 text-gray-500" />}
                            </React.Fragment>
                        ))}
                    </nav>
                    <div className="flex items-center space-x-2">
                        <button onClick={handleCreateFolder} className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gray-700 rounded-md hover:bg-gray-600"><FolderIcon className="w-4 h-4" /><span>New Folder</span></button>
                        <button onClick={() => setImageGeneratorOpen(true)} className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gray-700 rounded-md hover:bg-gray-600"><SparklesIcon className="w-4 h-4" /><span>AI Gen</span></button>
                        <button onClick={handleUpload} className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-indigo-600 rounded-md hover:bg-indigo-700"><ArrowUpOnSquareIcon className="w-4 h-4" /><span>Upload</span></button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" accept="image/*" />
                    </div>
                </header>
                <div 
                    ref={dropZoneRef}
                    className="flex-grow overflow-y-auto pr-2"
                    onDragOver={onDropZoneDragOver}
                    onDragLeave={onDropZoneDragLeave}
                    onDrop={onDropZoneDrop}
                >
                    <div className={`grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 ${isDraggingOver ? 'opacity-50' : ''}`}>
                        {currentFolderContents.map(renderItem)}
                    </div>
                    {currentFolderContents.length === 0 && (
                        <div className={`text-center mt-8 ${isDraggingOver ? 'text-indigo-400' : 'text-gray-500'}`}>
                            <p>{isDraggingOver ? 'Drop here to move to this folder' : 'This folder is empty.'}</p>
                        </div>
                    )}
                    {isDraggingOver && currentFolderContents.length > 0 && (
                        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-30">
                            <div className="bg-indigo-600/80 text-white px-6 py-3 rounded-lg text-lg font-semibold">
                                Drop to move to {breadcrumbs[breadcrumbs.length - 1]?.name || 'Root'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {isImageGeneratorOpen && <ImageGenerator isOpen={isImageGeneratorOpen} onClose={() => setImageGeneratorOpen(false)} saveToFolderId={currentFolderId} />}
            
            {/* Folder Creation Dialog */}
            <PromptDialog
                isOpen={showFolderPrompt}
                onClose={() => setShowFolderPrompt(false)}
                onConfirm={handleFolderCreate}
                title="Create New Folder"
                message="Enter a name for the new folder:"
                defaultValue="New Folder"
                placeholder="Folder name"
                confirmText="Create"
            />
            
            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, item: null })}
                onConfirm={confirmDelete}
                title="Delete Item"
                message={
                    deleteConfirmation.item?.type === 'folder' && deleteConfirmation.item.children.length > 0
                        ? `This folder contains ${deleteConfirmation.item.children.length} item(s). Are you sure you want to delete "${deleteConfirmation.item.name}" and all its contents?`
                        : `Are you sure you want to delete "${deleteConfirmation.item?.name}"?`
                }
                confirmText="Delete"
                isDangerous={true}
            />
        </Modal>
    );
};

export default MediaManager;