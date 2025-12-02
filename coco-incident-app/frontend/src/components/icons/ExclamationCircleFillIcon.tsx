import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const ExclamationCircleFillIcon: React.FC<IconProps> = ({
  width,
  height,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width || '1em'}
      height={height || '1em'}
      fill="currentColor"
      className="bi bi-exclamation-circle-fill"
      viewBox="0 0 16 16"
      {...props}
    >
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4m.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2" />
    </svg>
  );
};

export default ExclamationCircleFillIcon;
