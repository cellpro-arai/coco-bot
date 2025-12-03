import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  const baseClasses =
    'p-6 border border-gray-200 rounded-lg bg-white shadow-sm';

  return (
    <article className={`${baseClasses} ${className}`} {...props}>
      {children}
    </article>
  );
};

export default Card;
