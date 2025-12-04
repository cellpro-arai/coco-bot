import React, { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'contrast' | 'outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-600 dark:active:bg-blue-700',
  secondary:
    'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800 dark:bg-gray-500 dark:hover:bg-gray-600 dark:active:bg-gray-700',
  contrast:
    'bg-gray-800 text-white hover:bg-gray-900 active:bg-black dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-100 dark:active:bg-gray-50',
  outline:
    'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:border-gray-500 dark:active:bg-gray-700',
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-medium rounded-md transition-all duration-200 cursor-pointer';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const classes = [
    baseClasses,
    variantClasses[variant],
    disabledClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

export default Button;
