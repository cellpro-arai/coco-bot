import React, { ReactNode, ComponentPropsWithoutRef } from 'react';
import styles from './Article.module.css';

export const ARTICLE_VARIANT = {
  DANGER: 'danger',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success',
  PRIMARY: 'primary',
} as const;

export type ArticleVariant =
  (typeof ARTICLE_VARIANT)[keyof typeof ARTICLE_VARIANT];

interface ArticleProps extends ComponentPropsWithoutRef<'article'> {
  variant?: ArticleVariant;
  className?: string;
  children: ReactNode;
}

const Article: React.FC<ArticleProps> = ({
  variant,
  className = '',
  children,
  ...rest
}) => {
  const variantClass = variant ? styles[variant] : '';
  return (
    <article
      className={`${styles.article} ${variantClass} ${className}`}
      {...rest}
    >
      {children}
    </article>
  );
};

export default Article;
