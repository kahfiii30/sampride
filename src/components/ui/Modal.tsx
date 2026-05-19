import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  maxWidthClassName?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  maxWidthClassName = 'max-w-[520px]',
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className={`relative w-full ${maxWidthClassName} rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto z-10`}>
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
