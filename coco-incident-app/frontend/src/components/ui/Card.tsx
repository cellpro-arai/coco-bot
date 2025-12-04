import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'article';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  as = 'div',
  onClick,
  ...props
}) => {
  const baseClasses =
    'p-4 sm:p-6 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]';
  const interactiveClasses = onClick
    ? 'cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:border-blue-500 dark:hover:bg-gray-900 dark:hover:border-blue-400 active:bg-gray-200 dark:active:bg-gray-950'
    : '';
  const Component = as;

  return (
    <Component
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;
