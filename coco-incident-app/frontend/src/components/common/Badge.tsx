import React from 'react';
import styles from './Badge.module.css';

export type BadgeVariant =
  | 'primary'
  | 'warning'
  | 'secondary'
  | 'success'
  | 'contrast';

interface BadgeProps {
  variant?: BadgeVariant;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  variant,
  icon,
  children,
  className = '',
}) => {
  const classes = [styles.badge, variant && styles[variant], className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      {icon && <i className={icon}></i>}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
