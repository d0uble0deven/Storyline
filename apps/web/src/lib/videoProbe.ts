export type ProbeResult = {
  durationSeconds?: number;
  width?: number;
  height?: number;
  thumbnail?: Blob;
};

/**
 * Reads duration/dimensions and captures a poster frame from a video file,
 * entirely in the browser — no server-side media processing needed.
 */
export function probeVideoFile(file: File): Promise<ProbeResult> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const finish = (result: ProbeResult) => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      resolve(result);
    };

    const timer = setTimeout(() => finish({}), 8000);

    video.onerror = () => {
      clearTimeout(timer);
      finish({});
    };

    video.onloadedmetadata = () => {
      const meta = {
        durationSeconds: Number.isFinite(video.duration) ? video.duration : undefined,
        width: video.videoWidth || undefined,
        height: video.videoHeight || undefined,
      };
      // Seek a little way in for a more representative poster frame.
      const target = Number.isFinite(video.duration) ? Math.min(video.duration * 0.1, 3) : 0;
      video.currentTime = target;
      video.onseeked = () => {
        clearTimeout(timer);
        try {
          const canvas = document.createElement("canvas");
          const scale = Math.min(1, 640 / (video.videoWidth || 640));
          canvas.width = Math.round((video.videoWidth || 640) * scale);
          canvas.height = Math.round((video.videoHeight || 360) * scale);
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            finish(meta);
            return;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => finish({ ...meta, thumbnail: blob ?? undefined }),
            "image/jpeg",
            0.82
          );
        } catch {
          finish(meta);
        }
      };
      // Some containers never fire seeked at t=0.
      if (target === 0) {
        video.onseeked?.(new Event("seeked"));
      }
    };

    video.src = url;
  });
}
