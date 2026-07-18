import type { TextareaHTMLAttributes } from "react";
import styles from "./fields.module.css";

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={[styles.field, styles.textarea, className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
