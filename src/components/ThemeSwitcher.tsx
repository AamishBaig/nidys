import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Theme } from '../types';
import { PhotoIcon, PlusIcon, TrashIcon, PencilIcon } from './Icons';
import PromptDialog from './PromptDialog';
import ConfirmDialog from './ConfirmDialog';

const ThemeSwitcher: React.FC = () => {
    const { theme, setTheme, processedThemes, updateTheme, addTheme, deleteTheme, openMediaManager, themes } = useContext(AppContext);
    const [isOpen, setIsOpen] = useState(false);
    const [showAddThemeDialog, setShowAddThemeDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState<{ isOpen: boolean; themeId: string | null }>({ 
        isOpen: false, 
        themeId: null 
    });
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleThemeSelect = (themeId: string) => {
        setTheme(themeId);
        setIsOpen(false);
    };

    const handleSetThemeBackground = (themeId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
        openMediaManager((fileId) => {
            updateTheme(themeId, { backgroundImage: fileId });
        });
    };

    const handleAddTheme = (themeName: string) => {
        if (!themeName.trim()) return;
        
        const newTheme: Theme = {
            id: `theme-${Date.now()}`,
            name: themeName.trim(),
            backgroundImage: '',
            primaryColor: 'amber',
            secondaryColor: 'indigo',
            textColor: 'white',
        };
        
        addTheme(newTheme);
    };

    const handleDeleteTheme = (themeId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (themes.length <= 1) {
            alert("Cannot delete the last theme!");
            return;
        }
        if (theme.id === themeId) {
            alert("Cannot delete the currently active theme. Please switch to another theme first.");
            return;
        }
        setShowDeleteDialog({ isOpen: true, themeId });
    };

    const confirmDeleteTheme = () => {
        if (showDeleteDialog.themeId) {
            deleteTheme(showDeleteDialog.themeId);
        }
        setShowDeleteDialog({ isOpen: false, themeId: null });
    };

    return (
        <>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="px-3 py-1.5 text-sm font-medium bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center space-x-2"
                >
                    <span>Theme: {theme.name}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </button>
                {isOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
                        <div className="py-1 max-h-80 overflow-y-auto">
                            {processedThemes.map((t) => (
                                <div key={t.id} className="flex items-center justify-between px-2 py-1 hover:bg-gray-700 group">
                                    <button
                                        onClick={() => handleThemeSelect(t.id)}
                                        className="flex-1 text-left px-2 py-1 text-sm text-white truncate"
                                        title={t.name}
                                    >
                                        {t.id === theme.id && <span className="text-amber-400">● </span>}
                                        {t.name}
                                    </button>
                                    <div className="flex items-center space-x-1">
                                        <button 
                                            onClick={(e) => handleSetThemeBackground(t.id, e)}
                                            title={`Set background for ${t.name}`}
                                            className="p-1.5 rounded-md text-gray-400 hover:bg-indigo-600 hover:text-white transition-colors"
                                        >
                                            <PhotoIcon className="w-4 h-4" />
                                        </button>
                                        {themes.length > 1 && (
                                            <button 
                                                onClick={(e) => handleDeleteTheme(t.id, e)}
                                                title={`Delete ${t.name}`}
                                                className="p-1.5 rounded-md text-gray-400 hover:bg-red-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-gray-700 p-2">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setShowAddThemeDialog(true);
                                }}
                                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                            >
                                <PlusIcon className="w-4 h-4" />
                                <span>Add New Theme</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <PromptDialog
                isOpen={showAddThemeDialog}
                onClose={() => setShowAddThemeDialog(false)}
                onConfirm={handleAddTheme}
                title="Create New Theme"
                message="Enter a name for the new theme:"
                defaultValue="New Theme"
                placeholder="Theme name"
                confirmText="Create"
            />

            <ConfirmDialog
                isOpen={showDeleteDialog.isOpen}
                onClose={() => setShowDeleteDialog({ isOpen: false, themeId: null })}
                onConfirm={confirmDeleteTheme}
                title="Delete Theme"
                message={`Are you sure you want to delete this theme? This action cannot be undone.`}
                confirmText="Delete"
                isDangerous={true}
            />
        </>
    );
};

export default ThemeSwitcher;