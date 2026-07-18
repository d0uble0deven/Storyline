import { useState, type FormEvent } from "react";
import { Button } from "../atoms/Button.js";
import styles from "./PromptField.module.css";

type Props = {
  placeholder: string;
  submitLabel?: string;
  suggestions?: string[];
  loading?: boolean;
  onSubmit: (prompt: string) => void;
};

/** The conversational field used by the revision assistant. */
export function PromptField({ placeholder, submitLabel = "Ask Storyline", suggestions = [], loading, onSubmit }: Props) {
  const [value, setValue] = useState("");

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const prompt = value.trim();
    if (!prompt || loading) return;
    onSubmit(prompt);
    setValue("");
  };

  return (
    <div className={styles.wrap}>
      {suggestions.length > 0 && (
        <div className={styles.suggestions} role="list" aria-label="Suggested changes">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              role="listitem"
              className={styles.chip}
              disabled={loading}
              onClick={() => onSubmit(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <form className={styles.form} onSubmit={submit}>
        <textarea
          className={styles.input}
          value={value}
          rows={1}
          placeholder={placeholder}
          aria-label={placeholder}
          disabled={loading}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button type="submit" variant="primary" loading={loading} disabled={!value.trim()}>
          {submitLabel}
        </Button>
      </form>
    </div>
  );
}
