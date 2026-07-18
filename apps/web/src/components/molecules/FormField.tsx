import { useId, type ReactElement, type ReactNode } from "react";
import { cloneElement } from "react";
import styles from "./FormField.module.css";

type Props = {
  label: string;
  hint?: string;
  error?: string;
  children: ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>;
  optional?: boolean;
};

export function FormField({ label, hint, error, optional, children }: Props) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {optional && <span className={styles.optional}> · optional</span>}
      </label>
      {cloneElement(children, {
        id,
        "aria-describedby": hint || error ? hintId : undefined,
        "aria-invalid": error ? true : undefined,
      })}
      {(error || hint) && (
        <p id={hintId} className={error ? styles.error : styles.hint}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}
