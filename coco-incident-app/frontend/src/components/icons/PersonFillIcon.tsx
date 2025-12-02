import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const PersonFillIcon: React.FC<IconProps> = ({ width, height, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width || '1em'}
      height={height || '1em'}
      fill="currentColor"
      className="bi bi-person-fill"
      viewBox="0 0 16 16"
      {...props}
    >
      <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
    </svg>
  );
};

export default PersonFillIcon;
