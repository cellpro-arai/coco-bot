import React, { useEffect, useState } from 'react';

export const TOAST_VARIANT = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
} as const;

export type ToastVariant = (typeof TOAST_VARIANT)[keyof typeof TOAST_VARIANT];

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose?: () => void;
}

const variantClasses: Record<ToastVariant, string> = {
  success: 'bg-green-500 dark:bg-green-600 text-white',
  error: 'bg-red-500 dark:bg-red-600 text-white',
  info: 'bg-blue-500 dark:bg-blue-600 text-white',
  warning: 'bg-orange-500 dark:bg-orange-600 text-white',
};

const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'info',
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration <= 0) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const variantClass = variantClasses[variant];

  return (
    <div
      className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg animate-fade-in-down ${variantClass} z-50`}
      role="alert"
    >
      {message}
    </div>
  );
};

export default Toast;
