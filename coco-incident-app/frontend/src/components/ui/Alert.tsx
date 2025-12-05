import React, { ReactNode, ComponentPropsWithoutRef } from 'react';

export const ALERT_VARIANT = {
  DANGER: 'danger',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success',
  PRIMARY: 'primary',
} as const;

export type AlertVariant = (typeof ALERT_VARIANT)[keyof typeof ALERT_VARIANT];

interface AlertProps extends ComponentPropsWithoutRef<'div'> {
  variant?: AlertVariant;
  className?: string;
  children: ReactNode;
}

const variantClasses: Record<AlertVariant, string> = {
  danger:
    'bg-red-50 dark:bg-red-900/20 border border-red-500 dark:border-red-700',
  warning:
    'bg-orange-50 dark:bg-orange-900/20 border border-orange-500 dark:border-orange-700',
  info: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-500 dark:border-blue-700',
  success:
    'bg-green-50 dark:bg-green-900/20 border border-green-500 dark:border-green-700',
  primary:
    'bg-blue-50 dark:bg-blue-900/20 border border-blue-600 dark:border-blue-700',
};

const Alert: React.FC<AlertProps> = ({
  variant,
  className = '',
  children,
  ...rest
}) => {
  const baseClasses = 'p-6 rounded-lg dark:text-gray-300';
  const variantClass = variant ? variantClasses[variant] : '';
  const finalClasses = [baseClasses, variantClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={finalClasses} {...rest}>
      {children}
    </div>
  );
};

export default Alert;
