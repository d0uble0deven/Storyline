import { IconCheck } from "../icons.js";
import styles from "./Checkbox.module.css";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hideLabel?: boolean;
  disabled?: boolean;
};

export function Checkbox({ checked, onChange, label, hideLabel, disabled }: Props) {
  return (
    <label className={styles.row}>
      <span className={`${styles.box} ${checked ? styles.on : ""}`}>
        <input
          type="checkbox"
          className={styles.input}
          checked={checked}
          disabled={disabled}
          aria-label={hideLabel ? label : undefined}
          onChange={(e) => onChange(e.target.checked)}
        />
        {checked && <IconCheck size={12} />}
      </span>
      {!hideLabel && <span>{label}</span>}
    </label>
  );
}
