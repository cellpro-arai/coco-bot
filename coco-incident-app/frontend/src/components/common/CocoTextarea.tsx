import TooltipLabel from './TooltipLabel';
import React from 'react';

type Props = {
  icon: React.ReactNode;
  title: string;
  explain: string;
  required?: boolean;
  id: string;
  value: string;
  rows: number;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
};

export const CocoTextarea: React.FC<Props> = ({
  icon,
  title,
  explain,
  required,
  id,
  value,
  onChange,
  placeholder,
  rows,
}: Props) => {
  return (
    <label htmlFor={id}>
      <TooltipLabel
        icon={icon}
        label={title}
        tooltip={explain}
        required={required}
      />
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        rows={rows}
      />
    </label>
  );
};
