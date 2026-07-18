import styles from "./Spinner.module.css";

export function Spinner({ size = 18, label }: { size?: number; label?: string }) {
  return (
    <span className={styles.wrap} role={label ? "status" : undefined}>
      <svg
        className={styles.spinner}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
        <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}
