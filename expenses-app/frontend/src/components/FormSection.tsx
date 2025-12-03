import { ReactNode } from 'react';

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
  return (
    <fieldset>
      <legend className={required ? 'required-label' : ''}>{title}</legend>
      {children}
    </fieldset>
  );
}
