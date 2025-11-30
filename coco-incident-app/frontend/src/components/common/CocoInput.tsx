import { IconType } from './IconType';
import TooltipLabel from './TooltipLabel';

type Props = {
  icon: IconType;
  title: string;
  explain: string;
  required?: boolean;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
};

export const CocoInput: React.FC<Props> = ({
  icon,
  title,
  explain,
  required,
  id,
  value,
  onChange,
  placeholder,
}: Props) => {
  return (
    <label htmlFor={id}>
      <TooltipLabel
        icon={icon}
        label={title}
        tooltip={explain}
        required={required}
      />
      <input
        type="text"
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
      />
    </label>
  );
};
