import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { StoryType } from "@storyline/shared";
import { STORY_TYPES } from "@storyline/shared";
import { useCreateProject } from "../api/hooks.js";
import { Button } from "../components/atoms/Button.js";
import { Input } from "../components/atoms/Input.js";
import { Textarea } from "../components/atoms/Textarea.js";
import { FormField } from "../components/molecules/FormField.js";
import styles from "./NewProject.module.css";

export function NewProject() {
  const navigate = useNavigate();
  const create = useCreateProject();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [storyType, setStoryType] = useState<StoryType>("progression");
  const [useTemplate, setUseTemplate] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim()) {
      setError("Give your project a name — you can always change it later.");
      return;
    }
    setError(null);
    create.mutate(
      { name: name.trim(), description: description.trim() || undefined, storyType, useTemplate },
      {
        onSuccess: (project) => navigate(`/projects/${project.id}/media`),
        onError: (err) => setError(err.message),
      }
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Start a new story</h1>
        <p className={styles.subtitle}>
          Tell us a little about the film you want to make. Storyline shapes everything else around it.
        </p>
      </header>

      <div className={styles.form}>
        <FormField label="Project name" error={error ?? undefined}>
          <Input
            value={name}
            placeholder="My First Year Riding"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </FormField>

        <FormField label="Description" optional hint="A sentence about what this story means to you.">
          <Textarea
            value={description}
            rows={2}
            placeholder="A year of learning to ride a bike as an adult…"
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>What kind of story is it?</legend>
          <div className={styles.typeGrid} role="radiogroup" aria-label="Story type">
            {STORY_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={storyType === t.id}
                className={`${styles.typeCard} ${storyType === t.id ? styles.typeActive : ""}`}
                onClick={() => setStoryType(t.id)}
              >
                <span className={styles.typeLabel}>{t.label}</span>
                <span className={styles.typeBlurb}>{t.blurb}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>How would you like to begin?</legend>
          <div className={styles.startGrid} role="radiogroup" aria-label="Starting point">
            <button
              type="button"
              role="radio"
              aria-checked={useTemplate}
              className={`${styles.typeCard} ${useTemplate ? styles.typeActive : ""}`}
              onClick={() => setUseTemplate(true)}
            >
              <span className={styles.typeLabel}>Guided template</span>
              <span className={styles.typeBlurb}>Start with sensible defaults for this story type.</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={!useTemplate}
              className={`${styles.typeCard} ${!useTemplate ? styles.typeActive : ""}`}
              onClick={() => setUseTemplate(false)}
            >
              <span className={styles.typeLabel}>Blank creative brief</span>
              <span className={styles.typeBlurb}>A clean slate — describe everything in your own words.</span>
            </button>
          </div>
        </fieldset>

        <div className={styles.actions}>
          <Button variant="primary" size="lg" loading={create.isPending} onClick={submit}>
            Create project
          </Button>
        </div>
      </div>
    </div>
  );
}
