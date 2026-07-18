import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreativeBrief,
  ExportConfig,
  Highlight,
  Job,
  MediaItem,
  PlanSectionKey,
  PostProductionSettings,
  ProductionPlan,
  ProjectSummary,
  RenderPlan,
  Revision,
  Story,
  StoryChapter,
  StoryType,
} from "@storyline/shared";
import { api } from "./client.js";

export const keys = {
  projects: ["projects"] as const,
  project: (id: string) => ["project", id] as const,
  media: (id: string) => ["media", id] as const,
  plan: (id: string) => ["plan", id] as const,
  highlights: (id: string) => ["highlights", id] as const,
  story: (id: string) => ["story", id] as const,
  revisions: (id: string) => ["revisions", id] as const,
  analysis: (id: string) => ["analysis", id] as const,
  exportLatest: (id: string) => ["export", id] as const,
  renderPlan: (id: string) => ["renderPlan", id] as const,
};

/* ---------- Projects ---------- */

export function useProjects() {
  return useQuery({ queryKey: keys.projects, queryFn: () => api.get<ProjectSummary[]>("/api/projects") });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: keys.project(id ?? ""),
    queryFn: () => api.get<ProjectSummary>(`/api/projects/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description?: string; storyType: StoryType; useTemplate?: boolean }) =>
      api.post<ProjectSummary>("/api/projects", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.projects }),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Pick<ProjectSummary, "name" | "description" | "currentStage" | "coverUrl">>) =>
      api.patch<ProjectSummary>(`/api/projects/${id}`, patch),
    onSuccess: (project) => {
      qc.setQueryData(keys.project(id), project);
      qc.invalidateQueries({ queryKey: keys.projects });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.projects }),
  });
}

/* ---------- Media ---------- */

export function useMedia(projectId: string) {
  return useQuery({
    queryKey: keys.media(projectId),
    queryFn: () => api.get<MediaItem[]>(`/api/projects/${projectId}/media`),
  });
}

export function usePatchMedia(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; notes?: string; isImportant?: boolean }) =>
      api.patch<MediaItem>(`/api/media/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.media(projectId) }),
  });
}

export function useDeleteMedia(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/media/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.media(projectId) });
      qc.invalidateQueries({ queryKey: keys.project(projectId) });
    },
  });
}

/* ---------- Brief & plan ---------- */

export function useSaveBrief(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (brief: CreativeBrief) => api.put<CreativeBrief>(`/api/projects/${projectId}/brief`, brief),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.project(projectId) }),
  });
}

export function usePlan(projectId: string) {
  return useQuery({
    queryKey: keys.plan(projectId),
    queryFn: () => api.get<ProductionPlan | null>(`/api/projects/${projectId}/production-plan`),
  });
}

export function useGeneratePlan(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input?: { section?: PlanSectionKey }) =>
      api.post<ProductionPlan>(`/api/projects/${projectId}/production-plan/generate`, {
        mode: input?.section ? "section" : "all",
        section: input?.section,
      }),
    onSuccess: (plan) => {
      qc.setQueryData(keys.plan(projectId), plan);
      qc.invalidateQueries({ queryKey: keys.project(projectId) });
    },
  });
}

export function usePatchPlan(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sections: { key: PlanSectionKey; value?: string; isLocked?: boolean; resetToAi?: boolean }[]) =>
      api.patch<ProductionPlan>(`/api/projects/${projectId}/production-plan`, { sections }),
    onSuccess: (plan) => qc.setQueryData(keys.plan(projectId), plan),
  });
}

/* ---------- Analysis ---------- */

export function useAnalysisStatus(projectId: string) {
  return useQuery({
    queryKey: keys.analysis(projectId),
    queryFn: () => api.get<Job | null>(`/api/projects/${projectId}/analysis/status`),
    refetchInterval: (query) => (query.state.data?.status === "running" ? 900 : false),
    // Keep tracking progress even when the tab is in the background —
    // "you can leave this page, we keep working" has to stay true.
    refetchIntervalInBackground: true,
  });
}

export function useStartAnalysis(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<Job>(`/api/projects/${projectId}/analysis/start`),
    onSuccess: (job) => {
      qc.setQueryData(keys.analysis(projectId), job);
      // A real fetch must run for the refetchInterval to engage and begin polling.
      void qc.invalidateQueries({ queryKey: keys.analysis(projectId) });
    },
  });
}

/* ---------- Highlights ---------- */

export function useHighlights(projectId: string) {
  return useQuery({
    queryKey: keys.highlights(projectId),
    queryFn: () => api.get<Highlight[]>(`/api/projects/${projectId}/highlights`),
  });
}

export type HighlightPatch = { id: string } & Partial<
  Pick<Highlight, "title" | "status" | "priority" | "category" | "isFavorite" | "userNote" | "startSeconds" | "endSeconds">
> & { restoreAiTrim?: boolean };

export function usePatchHighlight(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: HighlightPatch) => api.patch<Highlight>(`/api/highlights/${id}`, patch),
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: keys.highlights(projectId) });
      const previous = qc.getQueryData<Highlight[]>(keys.highlights(projectId));
      qc.setQueryData<Highlight[]>(keys.highlights(projectId), (old) =>
        old?.map((h) => (h.id === id ? { ...h, ...patch } : h))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(keys.highlights(projectId), context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.highlights(projectId) });
      qc.invalidateQueries({ queryKey: keys.project(projectId) });
    },
  });
}

export function useBulkHighlights(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { ids: string[]; patch: Partial<Pick<Highlight, "status" | "priority" | "category">> }) =>
      api.post<Highlight[]>("/api/highlights/bulk-update", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.highlights(projectId) });
      qc.invalidateQueries({ queryKey: keys.project(projectId) });
    },
  });
}

/* ---------- Story & revisions ---------- */

export function useStory(projectId: string) {
  return useQuery({
    queryKey: keys.story(projectId),
    queryFn: () => api.get<Story | null>(`/api/projects/${projectId}/story`),
  });
}

export function useGenerateStory(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input?: { chapterId?: string }) =>
      api.post<Story>(`/api/projects/${projectId}/story/generate`, input ?? {}),
    onSuccess: (story) => {
      qc.setQueryData(keys.story(projectId), story);
      qc.invalidateQueries({ queryKey: keys.project(projectId) });
    },
  });
}

export function useSaveStory(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { chapters: StoryChapter[]; transient?: boolean }) =>
      api.patch<Story>(`/api/projects/${projectId}/story`, input),
    onSuccess: (story) => qc.setQueryData(keys.story(projectId), story),
  });
}

export function useUndoRedoStory(projectId: string) {
  const qc = useQueryClient();
  const undo = useMutation({
    mutationFn: () => api.post<Story>(`/api/projects/${projectId}/story/undo`),
    onSuccess: (story) => qc.setQueryData(keys.story(projectId), story),
  });
  const redo = useMutation({
    mutationFn: () => api.post<Story>(`/api/projects/${projectId}/story/redo`),
    onSuccess: (story) => qc.setQueryData(keys.story(projectId), story),
  });
  return { undo, redo };
}

export function useRevisions(projectId: string) {
  return useQuery({
    queryKey: keys.revisions(projectId),
    queryFn: () => api.get<Revision[]>(`/api/projects/${projectId}/revisions`),
  });
}

export function useCreateRevision(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prompt: string) => api.post<Revision>(`/api/projects/${projectId}/revisions`, { prompt }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.revisions(projectId) }),
  });
}

export function useResolveRevision(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: "applied" | "rejected" }) =>
      api.patch<Revision>(`/api/revisions/${input.id}`, { status: input.status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.revisions(projectId) });
      qc.invalidateQueries({ queryKey: keys.story(projectId) });
    },
  });
}

/* ---------- Post-production & export ---------- */

export function useSavePostProduction(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: PostProductionSettings) =>
      api.put<PostProductionSettings>(`/api/projects/${projectId}/post-production`, settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.project(projectId) }),
  });
}

export function useLatestExport(projectId: string) {
  return useQuery({
    queryKey: keys.exportLatest(projectId),
    queryFn: () => api.get<Job | null>(`/api/projects/${projectId}/export/latest`),
    refetchInterval: (query) => (query.state.data?.status === "running" ? 900 : false),
    refetchIntervalInBackground: true,
  });
}

export function useStartExport(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: ExportConfig) => api.post<Job>(`/api/projects/${projectId}/export`, config),
    onSuccess: (job) => {
      qc.setQueryData(keys.exportLatest(projectId), job);
      // A real fetch must run for the refetchInterval to engage and begin polling.
      void qc.invalidateQueries({ queryKey: keys.exportLatest(projectId) });
    },
  });
}

export function useRenderPlan(projectId: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.renderPlan(projectId),
    queryFn: () => api.get<RenderPlan>(`/api/projects/${projectId}/render-plan`),
    enabled,
  });
}
