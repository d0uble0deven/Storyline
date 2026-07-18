import { useState } from "react";
import type { Revision } from "@storyline/shared";
import { useCreateRevision, useResolveRevision, useRevisions } from "../../api/hooks.js";
import { Button } from "../atoms/Button.js";
import { Badge } from "../atoms/Badge.js";
import { PromptField } from "../molecules/PromptField.js";
import { IconWarning } from "../icons.js";
import styles from "./RevisionAssistant.module.css";

type Props = {
  projectId: string;
  title?: string;
  suggestions?: string[];
};

/**
 * The conversational revision panel: prompt in, proposed changes out.
 * Nothing is destroyed until the user applies a proposal.
 */
export function RevisionAssistant({ projectId, title = "What would you like to change?", suggestions = [] }: Props) {
  const { data: revisions } = useRevisions(projectId);
  const create = useCreateRevision(projectId);
  const resolve = useResolveRevision(projectId);
  const [error, setError] = useState<string | null>(null);

  const proposed = revisions?.find((r) => r.status === "proposed");
  const recentApplied = (revisions ?? []).filter((r) => r.status === "applied").slice(0, 3);

  const submit = (prompt: string) => {
    setError(null);
    create.mutate(prompt, { onError: (err) => setError(err.message) });
  };

  const respond = (revision: Revision, status: "applied" | "rejected") => {
    setError(null);
    resolve.mutate({ id: revision.id, status }, { onError: (err) => setError(err.message) });
  };

  return (
    <section className={styles.panel} aria-label="Revision assistant">
      <h3 className={styles.heading}>{title}</h3>
      {proposed ? (
        <div className={styles.proposal}>
          <div className={styles.proposalHead}>
            <Badge tone="info">Proposed changes</Badge>
            <span className={styles.prompt}>“{proposed.prompt}”</span>
          </div>
          <p className={styles.summary}>{proposed.summary}</p>
          <ul className={styles.changes}>
            {proposed.changes.map((c, i) => (
              <li key={i} className={c.type === "warning" ? styles.warning : undefined}>
                {c.type === "warning" && <IconWarning size={13} />} {c.description}
              </li>
            ))}
          </ul>
          <div className={styles.proposalActions}>
            <Button variant="primary" loading={resolve.isPending} onClick={() => respond(proposed, "applied")}>
              Apply changes
            </Button>
            <Button variant="ghost" disabled={resolve.isPending} onClick={() => respond(proposed, "rejected")}>
              Cancel
            </Button>
          </div>
          <p className={styles.reassure}>Your current version stays untouched until you apply.</p>
        </div>
      ) : (
        <PromptField
          placeholder="Ask Storyline to revise your video…"
          submitLabel="Suggest changes"
          suggestions={suggestions}
          loading={create.isPending}
          onSubmit={submit}
        />
      )}
      {error && <p className={styles.error}>{error}</p>}

      {recentApplied.length > 0 && !proposed && (
        <div className={styles.history}>
          <p className={styles.historyTitle}>Recent revisions</p>
          {recentApplied.map((r) => (
            <div key={r.id} className={styles.historyItem}>
              <p className={styles.historyPrompt}>“{r.prompt}”</p>
              <p className={styles.historySummary}>{r.summary}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
