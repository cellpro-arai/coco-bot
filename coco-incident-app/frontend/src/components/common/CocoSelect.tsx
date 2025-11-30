import { IconType } from './IconType';
import TooltipLabel from './TooltipLabel';

type Props = {
  icon: IconType;
  title: string;
  explain: string;
  id: string;
  selection: { [key in string]: string };
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
};

export const CocoSelect: React.FC<Props> = ({
  icon,
  title,
  explain,
  id,
  selection,
  value,
  onChange,
  required,
}: Props) => {
  return (
    <label htmlFor={id}>
      <TooltipLabel
        icon={icon}
        label={title}
        tooltip={explain}
        required={required}
      />
      <select id={id} value={value} onChange={onChange} required={required}>
        {Object.entries(selection).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
};
