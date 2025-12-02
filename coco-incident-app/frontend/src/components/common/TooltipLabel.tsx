import React, { useEffect } from 'react';
import { InfoCircleIcon } from '../icons';

interface TooltipLabelProps {
  icon: React.ReactNode;
  label: string; // ラベルテキスト
  tooltip: string; // ツールチップの内容
  required?: boolean; // 必須項目かどうか
  htmlTooltip?: boolean; // HTMLツールチップを許可するか
}

const TooltipLabel: React.FC<TooltipLabelProps> = ({
  icon,
  label,
  tooltip,
  required = false,
  htmlTooltip = false,
}) => {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).bootstrap) {
      const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]'
      );
      tooltipTriggerList.forEach(tooltipTriggerEl => {
        new (window as any).bootstrap.Tooltip(tooltipTriggerEl);
      });
    }
  }, []);

  return (
    <span className={required ? 'required-label' : ''}>
      {icon}
      {label}
      <InfoCircleIcon
        className="ms-2"
        style={{ cursor: 'pointer' }}
        data-bs-toggle="tooltip"
        data-bs-placement="right"
        data-bs-title={tooltip}
        data-bs-html={htmlTooltip ? 'true' : 'false'}
      />
    </span>
  );
};

export default TooltipLabel;


