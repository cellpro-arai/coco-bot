import React, { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'contrast' | 'outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700',
  contrast: 'bg-gray-800 text-white hover:bg-gray-900',
  outline:
    'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50',
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center px-4 py-2 text-base font-medium rounded-md transition-colors duration-150 cursor-pointer';
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
