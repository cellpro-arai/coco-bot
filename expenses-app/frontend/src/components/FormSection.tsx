import { ReactNode } from 'react';
import {
  legendBaseClass,
  sectionCardClass,
} from './formClasses';

interface FormSectionProps {
  title: string;
  required?: boolean;
  children: ReactNode;
}

export default function FormSection({
  title,
  required = false,
  children,
}: FormSectionProps) {
  // フォーム内のまとまりを fieldset と legend で表現する共通セクション
  const legendClass = required
    ? `${legendBaseClass} after:ml-1 after:text-rose-500 after:content-['*']`
    : legendBaseClass;

  return (
    <fieldset className={`${sectionCardClass} space-y-4`}>
      <legend className={legendClass}>{title}</legend>
      {children}
    </fieldset>
  );
}
