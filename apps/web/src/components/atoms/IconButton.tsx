import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./IconButton.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Accessible name — icon-only buttons must always describe themselves. */
  label: string;
  active?: boolean;
  tone?: "default" | "danger" | "accent";
  size?: "sm" | "md";
  children: ReactNode;
};

export function IconButton({ label, active, tone = "default", size = "md", children, className, ...rest }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={[styles.iconButton, styles[tone], styles[size], active ? styles.active : "", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
