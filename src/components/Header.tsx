import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import OrderHistory from './OrderHistory';
import { SpinnerIcon } from './Icons';
import ThemeSwitcher from './ThemeSwitcher';
import EditableField from './EditableField';
import PromptDialog from './PromptDialog';

const Header: React.FC = () => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  
  const { 
    isSaving, 
    isAdminMode, 
    setAdminMode, 
    setMediaManagerOpen,
    appTitle,
    setAppTitle
  } = useContext(AppContext);

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-40 bg-black/30 backdrop-blur-lg">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-1 flex items-center space-x-4 min-w-0">
              {isAdminMode ? (
                <EditableField
                  value={appTitle}
                  onChange={setAppTitle}
                  className="text-2xl font-bold tracking-wider text-amber-400"
                />
              ) : (
                <span className="text-2xl font-bold tracking-wider text-amber-400 truncate">{appTitle}</span>
              )}
              {isSaving && (
                <div className="flex items-center space-x-2 text-sm text-gray-300 animate-pulse">
                  <SpinnerIcon className="w-4 h-4" />
                  <span>Saving...</span>
                </div>
              )}
            </div>

                        <div className="flex-shrink-0 flex items-center space-x-4">
              {isAdminMode && (
                <>
                  <button
                    onClick={() => setShowOrderHistory(true)}
                    className="px-3 py-1.5 text-sm font-medium bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
                  >
                    Orders
                  </button>
                  <button
                    onClick={() => setMediaManagerOpen(true)}
                    className="px-3 py-1.5 text-sm font-medium bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Media
                  </button>
                  <ThemeSwitcher />
                </>
              )}

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-300">Admin Mode</span>
                <button
                  role="switch"
                  aria-checked={isAdminMode}
                  onClick={() => {
                    if (isAdminMode) {
                      setAdminMode(false);
                    } else {
                      setShowPasswordDialog(true);
                    }
                  }}
                  className={`${
                    isAdminMode ? 'bg-indigo-600' : 'bg-gray-600'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                >
                  <span
                    className={`${
                      isAdminMode ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
            <PromptDialog
        isOpen={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        onConfirm={(password) => {
          if (password === 'NidysFood84') {
            setAdminMode(true);
          } else {
            alert('Incorrect password!');
          }
        }}
        title="Admin Access"
        message="Enter the admin password:"
        placeholder="Password"
        confirmText="Enter"
      />
      
      <OrderHistory 
        isOpen={showOrderHistory} 
        onClose={() => setShowOrderHistory(false)} 
      />
    </>

  );
};

export default Header;
