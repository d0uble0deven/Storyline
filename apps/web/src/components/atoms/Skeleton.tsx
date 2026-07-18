import styles from "./Skeleton.module.css";

export function Skeleton({ width, height = 16, radius }: { width?: number | string; height?: number; radius?: number }) {
  return (
    <span
      className={styles.skeleton}
      style={{ width: width ?? "100%", height, borderRadius: radius ?? "var(--r-md)" }}
      aria-hidden="true"
    />
  );
}
