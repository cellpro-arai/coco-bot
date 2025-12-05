import React, {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
} from 'react';

// FormLabel
interface FormLabelProps {
  htmlFor: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const FormLabel: React.FC<FormLabelProps> = ({
  htmlFor,
  required,
  icon,
  children,
}) => {
  return (
    <label htmlFor={htmlFor} className="block">
      <span
        className={`flex items-center font-medium text-gray-700 dark:text-gray-300 ${required ? "after:content-['_*'] after:text-red-500" : ''}`}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {children}
      </span>
    </label>
  );
};

// FormInput
interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const FormInput: React.FC<FormInputProps> = ({
  className = '',
  ...props
}) => {
  return (
    <input
      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent ${className}`}
      {...props}
    />
  );
};

// FormEmailInput - メールアドレス入力欄（補完機能付き）
interface FormEmailInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  domain?: string;
}

export const FormEmailInput: React.FC<FormEmailInputProps> = ({
  className = '',
  domain = 'cellpromote.biz',
  value = '',
  ...props
}) => {
  const inputValue = String(value);
  const hasAt = inputValue.includes('@');
  const suggestion = !hasAt && inputValue ? `@${domain}` : '';

  return (
    <div className="relative">
      <input
        type="text"
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent ${className}`}
        value={inputValue}
        {...props}
      />
      {suggestion && (
        <span className="absolute left-3 top-2 pointer-events-none text-gray-900 dark:text-gray-100">
          <span className="opacity-0">{inputValue}</span>
          <span className="text-gray-400 dark:text-gray-500">{suggestion}</span>
        </span>
      )}
    </div>
  );
};

// FormTextarea
interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  className = '',
  ...props
}) => {
  return (
    <textarea
      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-y ${className}`}
      {...props}
    />
  );
};

// FormSelect
interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <select
      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};

// FormHelperText
interface FormHelperTextProps {
  children: React.ReactNode;
}

export const FormHelperText: React.FC<FormHelperTextProps> = ({ children }) => {
  return (
    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{children}</p>
  );
};

// FormGroup
interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  children,
  className = '',
}) => {
  return <div className={`mb-4 ${className}`}>{children}</div>;
};
