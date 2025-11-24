import React, { useMemo } from 'react';
import { useState } from 'react';

interface UrlProps {
  title: string;
  url: string;
  required?: boolean;
}

export const InputUrl: React.FC<UrlProps> = ({ title, url, required }: UrlProps) => {
  const [value, setValue] = useState<string>(url);
  const { inputStyle, message } = useMemo(() => {
    if (!value) {
      if (required) {
        return { inputStyle: { borderColor: 'red' }, message: 'URL is required' };
      } else {
        return { inputStyle: {}, message: '' };
      }
    } else if (value.startsWith('https://')) {
      return { inputStyle: {}, message: '' };
    } else {
      return { inputStyle: { borderColor: 'red' }, message: 'URL must start with https://' };
    }
  }, [value]);
  const blurHandler = (e: React.FocusEvent<HTMLInputElement>) => {
    if (value && !value.startsWith('https://')) {
      e.preventDefault();
    }
  };

  return (
    <div>
      <div>
        <label>{title}:</label>
        <input
          type='url'
          value={value}
          placeholder='https://...'
          onChange={e => setValue(e.target.value)}
          style={inputStyle}
          onBlur={blurHandler}
        />
      </div>
      <div>{message}</div>
    </div>
  );
};
