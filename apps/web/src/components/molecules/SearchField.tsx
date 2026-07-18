import { IconSearch, IconX } from "../icons.js";
import { IconButton } from "../atoms/IconButton.js";
import styles from "./SearchField.module.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchField({ value, onChange, placeholder = "Search" }: Props) {
  return (
    <div className={styles.wrap}>
      <IconSearch size={15} className={styles.icon} />
      <input
        type="search"
        className={styles.input}
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <IconButton label="Clear search" size="sm" onClick={() => onChange("")} className={styles.clear}>
          <IconX size={13} />
        </IconButton>
      )}
    </div>
  );
}
