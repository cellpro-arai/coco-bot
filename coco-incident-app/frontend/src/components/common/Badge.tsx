import React from 'react';

export type BadgeVariant =
  | 'primary'
  | 'warning'
  | 'secondary'
  | 'success'
  | 'contrast';

interface BadgeProps {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-blue-600 text-white',
  warning: 'bg-orange-500 text-white',
  secondary: 'bg-gray-600 text-white',
  success: 'bg-green-600 text-white',
  contrast: 'bg-gray-800 text-white',
};

const Badge: React.FC<BadgeProps> = ({
  variant = 'secondary',
  icon,
  children,
  className = '',
}) => {
  const baseClasses =
    'inline-flex items-center px-3 py-1 text-sm font-medium rounded whitespace-nowrap';
  const variantClass = variantClasses[variant];
  const classes = [baseClasses, variantClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      {icon}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
