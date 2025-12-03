import React from 'react';

export type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: React.ReactNode;
  underline?: boolean;
};

/**
 * アクセシビリティと視認性を考慮したカスタムリンクコンポーネント。
 * underline: true で下線、false で下線なし（色・太字・ホバー装飾）
 */
export const AppLink: React.FC<LinkProps> = ({
  children,
  underline = false,
  className = '',
  ...props
}) => {
  const base = underline
    ? 'underline text-blue-600 hover:text-blue-800 hover:underline font-medium'
    : 'text-blue-600 font-semibold hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400';
  return (
    <a className={`${base} ${className}`} {...props}>
      {children}
    </a>
  );
};

export default AppLink;
