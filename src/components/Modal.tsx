import React, { ReactNode } from 'react';
import { XMarkIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true"
      ></div>
      <div className={`bg-gray-800 border border-gray-700 rounded-lg shadow-2xl text-white flex flex-col relative m-4 ${className}`}>
        <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <h2 id="modal-title" className="text-xl font-semibold text-amber-400">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-gray-700"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6 flex-grow overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Modal;