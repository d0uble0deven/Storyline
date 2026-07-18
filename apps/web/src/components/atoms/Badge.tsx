import type { ReactNode } from "react";
import styles from "./Badge.module.css";

type Props = {
  tone?: "neutral" | "ok" | "warn" | "danger" | "accent" | "info";
  children: ReactNode;
  title?: string;
};

export function Badge({ tone = "neutral", children, title }: Props) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`} title={title}>
      {children}
    </span>
  );
}
