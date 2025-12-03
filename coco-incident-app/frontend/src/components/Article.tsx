import React, { ReactNode, ComponentPropsWithoutRef } from 'react';

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

const variantClasses: Record<ArticleVariant, string> = {
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

const Article: React.FC<ArticleProps> = ({
  variant,
  className = '',
  children,
  ...rest
}) => {
  const baseClasses = 'p-6 rounded-lg';
  const variantClass = variant ? variantClasses[variant] : '';
  const finalClasses = [baseClasses, variantClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={finalClasses} {...rest}>
      {children}
    </article>
  );
};

export default Article;
