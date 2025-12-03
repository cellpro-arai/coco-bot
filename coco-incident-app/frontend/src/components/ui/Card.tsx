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
  ...props
}) => {
  const baseClasses =
    'p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm';
  const Component = as;

  return (
    <Component className={`${baseClasses} ${className}`} {...props}>
      {children}
    </Component>
  );
};

export default Card;
