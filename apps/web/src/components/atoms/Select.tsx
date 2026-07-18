import type { SelectHTMLAttributes } from "react";
import { IconChevronDown } from "../icons.js";
import styles from "./fields.module.css";

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={styles.selectWrap}>
      <select className={[styles.field, styles.select, className].filter(Boolean).join(" ")} {...rest}>
        {children}
      </select>
      <IconChevronDown size={14} className={styles.chevron} />
    </span>
  );
}
