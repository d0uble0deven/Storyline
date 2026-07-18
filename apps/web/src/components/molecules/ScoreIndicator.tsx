import styles from "./ScoreIndicator.module.css";

type Props = {
  label: string;
  value: number;
  max?: number;
};

/** A compact labeled score bar (0–10) used on highlight cards. */
export function ScoreIndicator({ label, value, max = 10 }: Props) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const tone = value >= 8 ? styles.high : value >= 5 ? styles.mid : styles.low;
  return (
    <div className={styles.row} title={`${label}: ${value} of ${max}`}>
      <span className={styles.label}>{label}</span>
      <span className={styles.track} aria-hidden="true">
        <span className={`${styles.fill} ${tone}`} style={{ width: `${percent}%` }} />
      </span>
      <span className={styles.value}>{value}</span>
      <span className="sr-only">{`${label}: ${value} out of ${max}`}</span>
    </div>
  );
}
