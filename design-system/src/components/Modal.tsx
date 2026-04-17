import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else if (isVisible) {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = '';
      }, 200); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, isVisible]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, closeOnEscape, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  if (!isVisible) return null;

  const modalContent = (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        ${isAnimating ? 'modal-backdrop' : 'modal-exit'}
      `}
      onClick={handleBackdropClick}
    >
      <div
        className={`
          w-full ${sizeClasses[size]} bg-background-surface
          rounded-lg shadow-xl border border-border-primary
          transform-gpu will-animate
          ${isAnimating ? 'modal-content' : 'modal-exit'}
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-border-primary">
            <h2 id="modal-title" className="text-xl font-semibold text-text-primary">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="
                p-1 rounded-md text-text-secondary hover:text-text-primary
                hover:bg-background-secondary transition-colors duration-150
                focus:outline-none focus-ring
              "
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info'
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantClasses = {
    danger: 'text-danger',
    warning: 'text-warning',
    info: 'text-primary'
  };

  const buttonVariantClasses = {
    danger: 'bg-danger hover:bg-red-600',
    warning: 'bg-warning hover:bg-amber-600',
    info: 'bg-primary hover:bg-primaryDark'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-text-primary">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="
              px-4 py-2 text-text-primary bg-transparent border border-border-primary
              rounded-md hover:bg-background-secondary transition-colors duration-150
              focus:outline-none focus-ring
            "
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`
              px-4 py-2 text-white rounded-md transition-colors duration-150
              focus:outline-none focus-ring
              ${buttonVariantClasses[variant]}
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};