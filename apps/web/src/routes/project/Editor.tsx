import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  MusicSettings,
  PostProductionSettings,
  StoryItem,
  StyleSettings,
  TitleSettings,
  TransitionType,
  WatermarkSettings,
} from "@storyline/shared";
import {
  MUSIC_MOODS,
  MUSIC_TRACKS,
  STYLE_PRESETS,
  TRANSITION_PRESETS,
  TRANSITION_TYPES,
  type MusicTrack,
} from "@storyline/shared";
import {
  useHighlights,
  useMedia,
  useSavePostProduction,
  useSaveStory,
  useStory,
} from "../../api/hooks.js";
import { useProjectContext } from "./ProjectLayout.js";
import { Button } from "../../components/atoms/Button.js";
import { Badge } from "../../components/atoms/Badge.js";
import { Input } from "../../components/atoms/Input.js";
import { Select } from "../../components/atoms/Select.js";
import { Toggle } from "../../components/atoms/Toggle.js";
import { IconButton } from "../../components/atoms/IconButton.js";
import { EmptyState } from "../../components/molecules/EmptyState.js";
import { FormField } from "../../components/molecules/FormField.js";
import { RevisionAssistant } from "../../components/organisms/RevisionAssistant.js";
import { VideoPreview, resolveStoryItems } from "../../components/organisms/VideoPreview.js";
import { IconLock, IconPlay, IconTrash, IconUnlock } from "../../components/icons.js";
import { formatDuration } from "../../lib/format.js";
import styles from "./Editor.module.css";

const SUGGESTIONS = [
  "Make it shorter",
  "Increase the energy",
  "Make the ending stronger",
  "Remove repetitive clips",
  "Simplify the transitions",
  "Make it more emotional",
];

function Sparkline({ energy }: { energy: number[] }) {
  const points = energy.map((e, i) => `${(i / (energy.length - 1)) * 60},${18 - e * 16}`).join(" ");
  return (
    <svg viewBox="0 0 60 20" className={styles.sparkline} aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function MusicTrackRow({
  track,
  selected,
  onSelect,
}: {
  track: MusicTrack;
  selected: boolean;
  onSelect: () => void;
}) {
  const [previewing, setPreviewing] = useState(false);
  return (
    <div className={`${styles.trackRow} ${selected ? styles.trackSelected : ""}`}>
      <IconButton
        label={previewing ? `Stop previewing ${track.title}` : `Preview ${track.title}`}
        active={previewing}
        onClick={() => {
          setPreviewing(true);
          setTimeout(() => setPreviewing(false), 2500);
        }}
      >
        <IconPlay size={14} />
      </IconButton>
      <button type="button" className={styles.trackMain} onClick={onSelect} aria-pressed={selected}>
        <span className={styles.trackTitle}>{track.title}</span>
        <span className={styles.trackMeta}>
          {track.mood} · {formatDuration(track.durationSeconds)}
        </span>
      </button>
      <Sparkline energy={track.energy} />
      <Badge tone="ok" title="Licensed for personal use">Licensed</Badge>
    </div>
  );
}

type Tab = "clip" | "story" | "sound" | "style" | "text";

export function Editor() {
  const { project } = useProjectContext();
  const navigate = useNavigate();
  const { data: story } = useStory(project.id);
  const { data: highlights } = useHighlights(project.id);
  const { data: media } = useMedia(project.id);
  const savePost = useSavePostProduction(project.id);
  const saveStory = useSaveStory(project.id);

  const [settings, setSettings] = useState<PostProductionSettings>(project.postProduction);
  const [tab, setTab] = useState<Tab>("clip");
  const [focusIdx, setFocusIdx] = useState<number | undefined>(undefined);
  const [activeIdx, setActiveIdx] = useState(0);

  const items = useMemo(
    () => resolveStoryItems(story?.chapters ?? [], highlights ?? [], media ?? []),
    [story, highlights, media]
  );

  const persist = (next: PostProductionSettings) => {
    setSettings(next);
    savePost.mutate(next);
  };
  const setMusic = (patch: Partial<MusicSettings>) => persist({ ...settings, music: { ...settings.music, ...patch } });
  const setStyle = (patch: Partial<StyleSettings>) => persist({ ...settings, style: { ...settings.style, ...patch } });
  const setTitles = (patch: Partial<TitleSettings>) => persist({ ...settings, titles: { ...settings.titles, ...patch } });
  const setWatermark = (patch: Partial<WatermarkSettings>) =>
    persist({ ...settings, watermark: { ...settings.watermark, ...patch } });

  const selectedEntry = items[activeIdx];

  const updateSelectedItem = (patch: Partial<StoryItem>) => {
    if (!story || !selectedEntry) return;
    const chapters = story.chapters.map((c) => ({
      ...c,
      items: c.items.map((i) => (i.id === selectedEntry.item.id ? { ...i, ...patch } : i)),
    }));
    saveStory.mutate({ chapters });
  };

  const removeSelectedItem = () => {
    if (!story || !selectedEntry) return;
    const chapters = story.chapters.map((c) => ({
      ...c,
      items: c.items.filter((i) => i.id !== selectedEntry.item.id),
    }));
    saveStory.mutate({ chapters });
  };

  if (!story) {
    return (
      <EmptyState
        title="No first cut yet"
        message="Build your story first — then this workspace lets you preview it and finish the look, sound, and titles."
        action={
          <Button variant="primary" onClick={() => navigate(`/projects/${project.id}/story`)}>
            Go to story builder
          </Button>
        }
      />
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.workspace}>
        <div className={styles.previewCol}>
          <VideoPreview items={items} focusIndex={focusIdx} onActiveIndexChange={setActiveIdx} />

          <div className={styles.strip} role="list" aria-label="Story strip">
            {items.map((entry, i) => (
              <button
                key={entry.item.id}
                type="button"
                role="listitem"
                className={`${styles.stripItem} ${i === activeIdx ? styles.stripActive : ""}`}
                title={entry.item.type === "title-card" ? entry.item.title : entry.highlight?.title}
                onClick={() => {
                  setFocusIdx(i);
                  setTab("clip");
                }}
              >
                {entry.item.type === "title-card" ? (
                  <span className={styles.stripCard}>Aa</span>
                ) : entry.media?.thumbnailUrl ? (
                  <img src={entry.media.thumbnailUrl} alt="" className={styles.stripThumb} />
                ) : (
                  <span className={styles.stripCard}>·</span>
                )}
                <span className={styles.stripDuration}>{formatDuration(entry.item.durationSeconds)}</span>
              </button>
            ))}
          </div>

          <RevisionAssistant
            projectId={project.id}
            title="Ask Storyline to revise your video"
            suggestions={SUGGESTIONS}
          />
        </div>

        <aside className={styles.panel}>
          <div className={styles.tabs} role="tablist" aria-label="Editor panels">
            {(["clip", "story", "sound", "style", "text"] as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
                onClick={() => setTab(t)}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className={styles.panelBody}>
            {tab === "clip" && selectedEntry && (
              <div className={styles.stack}>
                <h3 className={styles.panelTitle}>
                  {selectedEntry.item.type === "title-card"
                    ? "Title card"
                    : selectedEntry.highlight?.title ?? "Clip"}
                </h3>
                {selectedEntry.item.type === "title-card" && (
                  <>
                    <FormField label="Title">
                      <Input
                        value={selectedEntry.item.title ?? ""}
                        onChange={(e) => updateSelectedItem({ title: e.target.value })}
                      />
                    </FormField>
                    <FormField label="Subtitle" optional>
                      <Input
                        value={selectedEntry.item.subtitle ?? ""}
                        onChange={(e) => updateSelectedItem({ subtitle: e.target.value })}
                      />
                    </FormField>
                  </>
                )}
                <FormField label="Duration (seconds)">
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    step={0.5}
                    value={selectedEntry.item.durationSeconds}
                    onChange={(e) => updateSelectedItem({ durationSeconds: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </FormField>
                <FormField label="Transition in">
                  <Select
                    value={selectedEntry.item.transitionIn ?? "cut"}
                    onChange={(e) => updateSelectedItem({ transitionIn: e.target.value as TransitionType })}
                  >
                    {TRANSITION_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </Select>
                </FormField>
                <div className={styles.clipActions}>
                  <Button
                    size="sm"
                    icon={selectedEntry.item.isLocked ? <IconLock size={13} /> : <IconUnlock size={13} />}
                    onClick={() => updateSelectedItem({ isLocked: !selectedEntry.item.isLocked })}
                  >
                    {selectedEntry.item.isLocked ? "Locked" : "Lock clip"}
                  </Button>
                  <Button size="sm" variant="danger" icon={<IconTrash size={13} />} onClick={removeSelectedItem}>
                    Remove
                  </Button>
                </div>
                <p className={styles.hint}>To swap this clip for another highlight, use the Story stage.</p>
              </div>
            )}

            {tab === "story" && (
              <div className={styles.stack}>
                <h3 className={styles.panelTitle}>Chapters</h3>
                {story.chapters.map((chapter, ci) => {
                  const firstIdx = items.findIndex((e) => chapter.items.some((i) => i.id === e.item.id));
                  const seconds = chapter.items.reduce((s, i) => s + i.durationSeconds, 0);
                  return (
                    <button
                      key={chapter.id}
                      type="button"
                      className={styles.chapterJump}
                      onClick={() => firstIdx >= 0 && setFocusIdx(firstIdx)}
                    >
                      <span className={styles.chapterJumpTitle}>
                        {ci + 1}. {chapter.title}
                      </span>
                      <span className={styles.chapterJumpMeta}>
                        {chapter.items.length} clips · {formatDuration(seconds)}
                      </span>
                    </button>
                  );
                })}
                <Button variant="ghost" onClick={() => navigate(`/projects/${project.id}/story`)}>
                  Open the story builder
                </Button>
              </div>
            )}

            {tab === "sound" && (
              <div className={styles.stack}>
                <h3 className={styles.panelTitle}>Music</h3>
                <div className={styles.moodChips}>
                  {MUSIC_MOODS.map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      className={`${styles.chip} ${settings.music.mood === mood ? styles.chipActive : ""}`}
                      aria-pressed={settings.music.mood === mood}
                      onClick={() => setMusic({ mood, trackId: mood === "No music" ? null : settings.music.trackId })}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
                {settings.music.mood !== "No music" && (
                  <div className={styles.tracks}>
                    {MUSIC_TRACKS.map((track) => (
                      <MusicTrackRow
                        key={track.id}
                        track={track}
                        selected={settings.music.trackId === track.id}
                        onSelect={() => setMusic({ trackId: track.id })}
                      />
                    ))}
                    <p className={styles.hint}>Upload your own music — coming soon.</p>
                  </div>
                )}
                <label className={styles.slider}>
                  Music volume — {settings.music.volume}%
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.music.volume}
                    onChange={(e) => setMusic({ volume: Number(e.target.value) })}
                  />
                </label>
                <Toggle checked={settings.music.preserveNaturalAudio} label="Preserve natural audio" hint="Keep real-world sound from your clips" onChange={(v) => setMusic({ preserveNaturalAudio: v })} />
                <Toggle checked={settings.music.duckUnderSpeech} label="Lower music during speech" onChange={(v) => setMusic({ duckUnderSpeech: v })} />
                <Toggle checked={settings.music.syncCutsToMusic} label="Sync cuts to music" onChange={(v) => setMusic({ syncCutsToMusic: v })} />
                <Toggle checked={settings.music.fadeIn} label="Fade in" onChange={(v) => setMusic({ fadeIn: v })} />
                <Toggle checked={settings.music.fadeOut} label="Fade out" onChange={(v) => setMusic({ fadeOut: v })} />
              </div>
            )}

            {tab === "style" && (
              <div className={styles.stack}>
                <h3 className={styles.panelTitle}>Visual style</h3>
                <div className={styles.presetGrid}>
                  {STYLE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`${styles.preset} ${settings.style.preset === preset ? styles.presetActive : ""}`}
                      aria-pressed={settings.style.preset === preset}
                      onClick={() => setStyle({ preset })}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <Toggle checked={settings.style.stabilization} label="Stabilization" onChange={(v) => setStyle({ stabilization: v })} />
                <Toggle checked={settings.style.colorCorrection} label="Color correction" onChange={(v) => setStyle({ colorCorrection: v })} />
                <Toggle checked={settings.style.exposureMatching} label="Exposure matching" hint="Even out footage shot months apart" onChange={(v) => setStyle({ exposureMatching: v })} />
                <Toggle checked={settings.style.slowMotion} label="Slow motion on key moments" onChange={(v) => setStyle({ slowMotion: v })} />
                <Toggle checked={settings.style.horizonLeveling} label="Horizon leveling" onChange={(v) => setStyle({ horizonLeveling: v })} />
                <FormField label="Crop behavior">
                  <Select value={settings.style.cropBehavior} onChange={(e) => setStyle({ cropBehavior: e.target.value as "fit" | "fill" })}>
                    <option value="fit">Fit — keep everything in frame</option>
                    <option value="fill">Fill — crop to fill the frame</option>
                  </Select>
                </FormField>
                <label className={styles.slider}>
                  Grain — {settings.style.grain}%
                  <input type="range" min={0} max={100} value={settings.style.grain} onChange={(e) => setStyle({ grain: Number(e.target.value) })} />
                </label>
                <label className={styles.slider}>
                  Vignette — {settings.style.vignette}%
                  <input type="range" min={0} max={100} value={settings.style.vignette} onChange={(e) => setStyle({ vignette: Number(e.target.value) })} />
                </label>
                <h3 className={styles.panelTitle}>Transitions</h3>
                <div className={styles.moodChips}>
                  {TRANSITION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`${styles.chip} ${settings.transitions.preset === preset ? styles.chipActive : ""}`}
                      aria-pressed={settings.transitions.preset === preset}
                      onClick={() => persist({ ...settings, transitions: { ...settings.transitions, preset } })}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === "text" && (
              <div className={styles.stack}>
                <h3 className={styles.panelTitle}>Titles</h3>
                <FormField label="Opening title">
                  <Input value={settings.titles.openingTitle} placeholder="Learning to Ride" onChange={(e) => setTitles({ openingTitle: e.target.value })} />
                </FormField>
                <FormField label="Opening subtitle" optional>
                  <Input value={settings.titles.openingSubtitle} placeholder="2026" onChange={(e) => setTitles({ openingSubtitle: e.target.value })} />
                </FormField>
                <Toggle checked={settings.titles.showDates} label="Show dates" onChange={(v) => setTitles({ showDates: v })} />
                <Toggle checked={settings.titles.showLocations} label="Location labels" onChange={(v) => setTitles({ showLocations: v })} />
                <Toggle checked={settings.titles.showMilestones} label="Milestone labels" onChange={(v) => setTitles({ showMilestones: v })} />
                <Toggle checked={settings.titles.chapterCards} label="Chapter cards" onChange={(v) => setTitles({ chapterCards: v })} />
                <FormField label="Closing message" optional>
                  <Input value={settings.titles.closingMessage} placeholder="One ride at a time." onChange={(e) => setTitles({ closingMessage: e.target.value })} />
                </FormField>

                <h3 className={styles.panelTitle}>Watermark</h3>
                <FormField label="Watermark">
                  <Select
                    value={settings.watermark.mode}
                    onChange={(e) => setWatermark({ mode: e.target.value as WatermarkSettings["mode"] })}
                  >
                    <option value="none">No watermark</option>
                    <option value="storyline">Storyline watermark</option>
                    <option value="custom-text">Custom text</option>
                    <option value="custom-logo">Custom logo (coming soon)</option>
                  </Select>
                </FormField>
                {settings.watermark.mode === "custom-text" && (
                  <FormField label="Watermark text">
                    <Input value={settings.watermark.text} onChange={(e) => setWatermark({ text: e.target.value })} />
                  </FormField>
                )}
                {settings.watermark.mode !== "none" && (
                  <>
                    <FormField label="Position">
                      <Select
                        value={settings.watermark.position}
                        onChange={(e) => setWatermark({ position: e.target.value as WatermarkSettings["position"] })}
                      >
                        <option value="bottom-right">Bottom right</option>
                        <option value="bottom-left">Bottom left</option>
                        <option value="top-right">Top right</option>
                        <option value="top-left">Top left</option>
                      </Select>
                    </FormField>
                    <label className={styles.slider}>
                      Opacity — {settings.watermark.opacity}%
                      <input type="range" min={10} max={100} value={settings.watermark.opacity} onChange={(e) => setWatermark({ opacity: Number(e.target.value) })} />
                    </label>
                    <FormField label="Size">
                      <Select
                        value={settings.watermark.size}
                        onChange={(e) => setWatermark({ size: e.target.value as WatermarkSettings["size"] })}
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </Select>
                    </FormField>
                  </>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
