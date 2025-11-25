import React, { useMemo, useState } from 'react';

interface Props extends React.HTMLAttributes<HTMLInputElement> {
  title: string;
  value?: Date;
  required?: boolean;
}

export const InputDate: React.FC<Props> = ({ value, title, required }: Props) => {
  const [v, setV] = useState<Date | undefined>(value);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : undefined;
    setV(newDate);
  };
  const valueStr = useMemo(() => {
    if (!v) return '';
    return v.toLocaleString();
  }, [v]);

  return (
    <div>
      <label>{title}</label>
      <label className='w-[4px] text-red-500 m-[1px]'>{required ? '*' : ''}</label>
      <input type='date' onChange={onChange} value={valueStr} />
    </div>
  );
};
