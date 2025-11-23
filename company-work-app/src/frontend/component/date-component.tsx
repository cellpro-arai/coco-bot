import React, { useMemo, useState } from 'react';

export enum DateFormat {
  YYYYMMDD = 'yyyy/MM/dd',
  YYYYMM = 'yyyy/MM',
}

interface Props extends React.HTMLAttributes<HTMLInputElement> {
  title: string;
  value?: Date;
  format: DateFormat;
}

export const DateComponent: React.FC<Props> = ({ value, format, title }: Props) => {
  const [v, setV] = useState<Date | undefined>(value);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : undefined;
    setV(newDate);
  };
  const valueStr = useMemo(() => {
    if (!v) return '';
    const year = v.getFullYear();
    const month = (v.getMonth() + 1).toString().padStart(2, '0');
    const day = v.getDate().toString().padStart(2, '0');
    if (format === DateFormat.YYYYMMDD) {
      return `${year}/${month}/${day}`;
    } else if (format === DateFormat.YYYYMM) {
      return `${year}/${month}`;
    }
    return '';
  }, [v, format]);

  return (
    <div>
      <label>{title}</label>
      <input type='date' onChange={onChange} value={valueStr} />
    </div>
  );
};
