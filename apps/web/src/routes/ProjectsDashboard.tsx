import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ProjectSummary } from "@storyline/shared";
import { useDeleteProject, useProjects } from "../api/hooks.js";
import { Button } from "../components/atoms/Button.js";
import { Select } from "../components/atoms/Select.js";
import { Skeleton } from "../components/atoms/Skeleton.js";
import { SearchField } from "../components/molecules/SearchField.js";
import { EmptyState } from "../components/molecules/EmptyState.js";
import { ConfirmDialog } from "../components/molecules/Modal.js";
import { ProjectCard } from "../components/organisms/ProjectCard.js";
import { IconFilm, IconPlus } from "../components/icons.js";
import styles from "./ProjectsDashboard.module.css";

type SortKey = "recent" | "name" | "progress";

export function ProjectsDashboard() {
  const { data: projects, isLoading, error } = useProjects();
  const deleteProject = useDeleteProject();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [toDelete, setToDelete] = useState<ProjectSummary | null>(null);

  const filtered = useMemo(() => {
    const list = (projects ?? []).filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (sort === "name") return [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "progress") return [...list].sort((a, b) => b.progressPercent - a.progressPercent);
    return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [projects, search, sort]);

  const recentlyEdited = filtered.slice(0, 1);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Your stories</h1>
          <p className={styles.subtitle}>Every project is a film waiting to be finished.</p>
        </div>
        <div className={styles.controls}>
          <SearchField value={search} onChange={setSearch} placeholder="Search projects" />
          <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort projects">
            <option value="recent">Recently edited</option>
            <option value="name">Name</option>
            <option value="progress">Progress</option>
          </Select>
          <Link to="/projects/new">
            <Button variant="primary" icon={<IconPlus size={15} />}>New project</Button>
          </Link>
        </div>
      </header>

      {error && (
        <EmptyState
          title="Couldn't load your projects"
          message={error.message}
          action={<Button onClick={() => window.location.reload()}>Try again</Button>}
        />
      )}

      {isLoading && (
        <div className={styles.grid}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={styles.skeletonCard}>
              <Skeleton height={150} radius={12} />
              <Skeleton width="70%" />
              <Skeleton width="45%" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <EmptyState
          icon={<IconFilm size={24} />}
          title={search ? "No projects match your search" : "No stories yet"}
          message={
            search
              ? "Try a different name, or start something new."
              : "Your videos already contain a story. Start your first project and let Storyline find it."
          }
          action={
            <Link to="/projects/new">
              <Button variant="primary" icon={<IconPlus size={15} />}>Start a story</Button>
            </Link>
          }
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <>
          {sort === "recent" && !search && recentlyEdited.length > 0 && (
            <p className={styles.sectionLabel}>Recently edited</p>
          )}
          <div className={styles.grid}>
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} onDelete={setToDelete} />
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this project?"
        message={`“${toDelete?.name}” and its uploaded videos will be permanently removed. This can't be undone.`}
        confirmLabel="Delete permanently"
        danger
        loading={deleteProject.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            deleteProject.mutate(toDelete.id, { onSettled: () => setToDelete(null) });
          }
        }}
      />
    </div>
  );
}
