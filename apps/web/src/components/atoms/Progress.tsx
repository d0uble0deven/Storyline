import styles from "./Progress.module.css";

type Props = {
  value: number;
  max?: number;
  label: string;
  tone?: "accent" | "ok" | "neutral";
  size?: "sm" | "md";
};

export function Progress({ value, max = 100, label, tone = "accent", size = "md" }: Props) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      className={`${styles.track} ${styles[size]}`}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div className={`${styles.fill} ${styles[tone]}`} style={{ width: `${percent}%` }} />
    </div>
  );
}
