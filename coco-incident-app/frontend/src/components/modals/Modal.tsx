import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
}) => {
  // モーダルが開いている間、背景をスクロール不可にする
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60">
      <div
        className={`bg-gray-100 dark:bg-gray-800 rounded-lg shadow-xl ${sizeClasses[size]} w-full mx-4 max-h-[90vh] overflow-y-auto`}
      >
        {(title || subtitle) && (
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <button
              onClick={onClose}
              className="float-right text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
            {title && (
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
        )}

        {children && <div className="p-6">{children}</div>}

        {footer && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
