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
  danger: 'bg-red-50 border border-red-500',
  warning: 'bg-orange-50 border border-orange-500',
  info: 'bg-blue-50 border border-blue-500',
  success: 'bg-green-50 border border-green-500',
  primary: 'bg-blue-50 border border-blue-600',
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
