import React from 'react';
import { AlertTriangle, Trash2, HelpCircle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 text-red-600">
            <Trash2 size={24} />
          </div>
        );
      case 'warning':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600">
            <AlertTriangle size={24} />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600">
            <HelpCircle size={24} />
          </div>
        );
    }
  };

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'danger';
      case 'warning':
        return 'primary'; // Or custom warning color
      case 'info':
      default:
        return 'primary';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      {/* Backdrop */}
      <div className="absolute inset-0 transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-[420px] rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl z-10 transition-transform scale-100">
        <div className="text-center">
          {getIcon()}
          
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            {title}
          </h3>
          
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <Button 
            type="button" 
            variant="secondary" 
            className="w-full sm:order-1" 
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button 
            type="button" 
            variant={getConfirmButtonVariant()} 
            className="w-full sm:order-2" 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
