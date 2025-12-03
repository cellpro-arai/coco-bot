import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  fluid?: boolean;
  className?: string;
}

const Container: React.FC<ContainerProps> = ({
  children,
  fluid = false,
  className = '',
}) => {
  const baseClasses = fluid ? 'w-full px-4' : 'w-full max-w-7xl mx-auto px-4';

  return <div className={`${baseClasses} ${className}`}>{children}</div>;
};

export default Container;
