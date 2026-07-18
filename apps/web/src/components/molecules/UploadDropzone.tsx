import { useRef, useState, type DragEvent } from "react";
import { ACCEPTED_VIDEO_TYPES, MAX_UPLOAD_BYTES } from "@storyline/shared";
import { IconUpload } from "../icons.js";
import styles from "./UploadDropzone.module.css";

type Props = {
  onFiles: (files: File[]) => void;
  onRejected: (message: string) => void;
};

const ACCEPT_EXT = /\.(mp4|mov|webm|avi|mkv)$/i;

export function UploadDropzone({ onFiles, onRejected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accept = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const good: File[] = [];
    const bad: string[] = [];
    for (const file of Array.from(list)) {
      const typeOk = ACCEPTED_VIDEO_TYPES.includes(file.type) || ACCEPT_EXT.test(file.name);
      if (!typeOk) bad.push(`${file.name} isn't a supported video format.`);
      else if (file.size > MAX_UPLOAD_BYTES) bad.push(`${file.name} is larger than the 2 GB limit.`);
      else good.push(file);
    }
    if (bad.length > 0) onRejected(bad.join(" "));
    if (good.length > 0) onFiles(good);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    accept(e.dataTransfer.files);
  };

  return (
    <div
      className={`${styles.zone} ${dragging ? styles.dragging : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <IconUpload size={26} className={styles.icon} />
      <p className={styles.title}>Drag your videos here</p>
      <p className={styles.hint}>MP4, MOV, WebM, AVI, or MKV — up to 2 GB each</p>
      <button type="button" className={styles.browse} onClick={() => inputRef.current?.click()}>
        Or choose files
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="video/*,.mp4,.mov,.webm,.avi,.mkv"
        multiple
        className="sr-only"
        aria-label="Choose video files to upload"
        onChange={(e) => {
          accept(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
