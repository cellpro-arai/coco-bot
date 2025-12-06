import { ReactNode } from 'react';
import Card from '../ui/Card';

interface HeaderProps {
  icon: ReactNode;
  title: string;
  description: string;
  iconBgColor?: string;
  iconTextColor?: string;
}

export default function Header({
  icon,
  title,
  description,
  iconBgColor = 'bg-indigo-100',
  iconTextColor = 'text-indigo-600',
}: HeaderProps) {
  return (
    <Card centered>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:text-left">
        <span
          className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${iconBgColor} text-3xl ${iconTextColor}`}
        >
          {icon}
        </span>
        <div className="sm:text-left">
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
      </div>
    </Card>
  );
}
