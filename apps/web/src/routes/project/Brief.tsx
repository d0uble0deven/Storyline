import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CreativeBrief } from "@storyline/shared";
import { AUDIENCES, LENGTH_OPTIONS, STRUCTURES, TONES } from "@storyline/shared";
import { useGeneratePlan, useSaveBrief } from "../../api/hooks.js";
import { useProjectContext } from "./ProjectLayout.js";
import { Button } from "../../components/atoms/Button.js";
import { Input } from "../../components/atoms/Input.js";
import { Select } from "../../components/atoms/Select.js";
import { Textarea } from "../../components/atoms/Textarea.js";
import { FormField, FieldRow } from "../../components/molecules/FormField.js";
import styles from "./Brief.module.css";

const EXAMPLES = [
  {
    label: "A year of progress",
    text: "Create a four-minute video about my first year learning to ride a bike as an adult. Show the progression from nervous beginner to confident rider, with early awkward moments, milestones, scenic rides, and my smoothest riding at the end.",
  },
  {
    label: "A trip to remember",
    text: "Make a three-minute recap of our two weeks in Japan. Focus on food, temples, and the little in-between moments. Keep it warm and a bit playful, with upbeat music and quick cuts.",
  },
  {
    label: "A tribute",
    text: "Create a gentle five-minute film celebrating Grandma's 80th birthday, using clips from across the years. Reflective tone, soft music, and end with the whole family together at the party.",
  },
];

export function Brief() {
  const { project } = useProjectContext();
  const navigate = useNavigate();
  const saveBrief = useSaveBrief(project.id);
  const generatePlan = useGeneratePlan(project.id);

  const existing = project.creativeBrief;
  const [overview, setOverview] = useState(existing?.overview ?? "");
  const [length, setLength] = useState<number | undefined>(existing?.targetDurationSeconds);
  const [tones, setTones] = useState<string[]>(existing?.tones ?? []);
  const [structure, setStructure] = useState(existing?.structure ?? "");
  const [audience, setAudience] = useState(existing?.audience ?? "");
  const [ending, setEnding] = useState(existing?.ending ?? "");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const buildBrief = (): CreativeBrief => ({
    overview: overview.trim(),
    targetDurationSeconds: length,
    tones,
    structure: structure || undefined,
    audience: audience || undefined,
    ending: ending.trim() || undefined,
    title: title.trim() || undefined,
  });

  const saveDraft = () => {
    setError(null);
    saveBrief.mutate(buildBrief(), {
      onSuccess: () => {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
      },
      onError: (err) => setError(err.message),
    });
  };

  const generate = () => {
    if (!overview.trim()) {
      setError("Describe your story first — the production plan is built from it.");
      return;
    }
    setError(null);
    saveBrief.mutate(buildBrief(), {
      onSuccess: () =>
        generatePlan.mutate(undefined, {
          onSuccess: () => navigate(`/projects/${project.id}/plan`),
          onError: (err) => setError(err.message),
        }),
      onError: (err) => setError(err.message),
    });
  };

  const toggleTone = (tone: string) => {
    setTones((t) => (t.includes(tone) ? t.filter((x) => x !== tone) : [...t, tone]));
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>What story do you want to tell?</h2>
        <p className={styles.subtitle}>
          Describe what happened, what matters most, how the video should feel, and what you want viewers to remember.
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.main}>
          <Textarea
            value={overview}
            rows={9}
            className={styles.overview}
            aria-label="Your creative brief"
            placeholder="Tell Storyline about your story — the more honestly you describe it, the better the film…"
            onChange={(e) => setOverview(e.target.value)}
          />

          <details className={styles.examples}>
            <summary className={styles.examplesSummary}>Need a starting point? See example briefs</summary>
            <div className={styles.exampleList}>
              {EXAMPLES.map((ex) => (
                <button key={ex.label} type="button" className={styles.example} onClick={() => setOverview(ex.text)}>
                  <span className={styles.exampleLabel}>{ex.label}</span>
                  <span className={styles.exampleText}>{ex.text}</span>
                </button>
              ))}
            </div>
          </details>

          <section className={styles.guided} aria-label="Guided brief options">
            <h3 className={styles.guidedTitle}>Shape the details</h3>
            <p className={styles.guidedHint}>Optional — these sharpen your brief without replacing it.</p>

            <div className={styles.chipGroup} role="group" aria-label="Desired length">
              <p className={styles.chipLabel}>Length</p>
              <div className={styles.chips}>
                {LENGTH_OPTIONS.map((opt) => (
                  <button
                    key={opt.seconds}
                    type="button"
                    className={`${styles.chip} ${length === opt.seconds ? styles.chipActive : ""}`}
                    aria-pressed={length === opt.seconds}
                    onClick={() => setLength(length === opt.seconds ? undefined : opt.seconds)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.chipGroup} role="group" aria-label="Tone">
              <p className={styles.chipLabel}>Tone — pick any</p>
              <div className={styles.chips}>
                {TONES.map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    className={`${styles.chip} ${tones.includes(tone) ? styles.chipActive : ""}`}
                    aria-pressed={tones.includes(tone)}
                    onClick={() => toggleTone(tone)}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <FieldRow>
              <FormField label="Story structure" optional>
                <Select value={structure} onChange={(e) => setStructure(e.target.value)}>
                  <option value="">Let Storyline decide</option>
                  {STRUCTURES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Audience" optional>
                <Select value={audience} onChange={(e) => setAudience(e.target.value)}>
                  <option value="">Let Storyline decide</option>
                  {AUDIENCES.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </Select>
              </FormField>
            </FieldRow>

            <FieldRow>
              <FormField label="Working title" optional>
                <Input value={title} placeholder="Learning to Ride" onChange={(e) => setTitle(e.target.value)} />
              </FormField>
              <FormField label="How should it end?" optional>
                <Input
                  value={ending}
                  placeholder="One ride at a time."
                  onChange={(e) => setEnding(e.target.value)}
                />
              </FormField>
            </FieldRow>
          </section>

          {error && <p className={styles.error} role="alert">{error}</p>}

          <div className={styles.actions}>
            <Button onClick={saveDraft} loading={saveBrief.isPending && !generatePlan.isPending}>
              {savedFlash ? "Saved" : "Save draft"}
            </Button>
            <Button variant="primary" size="lg" onClick={generate} loading={generatePlan.isPending}>
              Generate production plan
            </Button>
          </div>
        </div>

        <aside className={styles.aside}>
          <h3 className={styles.asideTitle}>What makes a great brief</h3>
          <ul className={styles.tips}>
            <li>Say what actually happened — including the messy parts.</li>
            <li>Name the feeling you want viewers left with.</li>
            <li>Mention specific moments you already know you love.</li>
            <li>Describe the ending, if you know it.</li>
            <li>Don't worry about editing terms. Storyline translates.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
