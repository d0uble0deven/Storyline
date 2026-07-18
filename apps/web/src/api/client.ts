export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Couldn't reach Storyline. Check your connection and try again.");
  }
  if (response.status === 204) return undefined as T;
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : "Something went wrong. Please try again.";
    throw new ApiError(response.status, message);
  }
  return data as T;
}

export const api = {
  get: <T>(url: string) => request<T>("GET", url),
  post: <T>(url: string, body?: unknown) => request<T>("POST", url, body),
  put: <T>(url: string, body: unknown) => request<T>("PUT", url, body),
  patch: <T>(url: string, body: unknown) => request<T>("PATCH", url, body),
  delete: <T>(url: string) => request<T>("DELETE", url),
};

export type UploadMeta = {
  durationSeconds?: number;
  width?: number;
  height?: number;
  recordedAt?: string;
  thumbnail?: Blob;
};

/** Multipart upload with progress reporting (XHR — fetch still can't report upload progress everywhere). */
export function uploadMediaFile<T>(
  projectId: string,
  file: File,
  meta: UploadMeta,
  onProgress: (percent: number) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file, file.name);
    if (meta.thumbnail) form.append("thumbnail", meta.thumbnail, "thumb.jpg");
    if (meta.durationSeconds !== undefined) form.append("durationSeconds", String(meta.durationSeconds));
    if (meta.width !== undefined) form.append("width", String(meta.width));
    if (meta.height !== undefined) form.append("height", String(meta.height));
    if (meta.recordedAt) form.append("recordedAt", meta.recordedAt);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/projects/${projectId}/media`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || "null");
        if (xhr.status >= 200 && xhr.status < 300) resolve(data as T);
        else reject(new ApiError(xhr.status, data?.error ?? "Upload failed. Please try again."));
      } catch {
        reject(new ApiError(xhr.status, "Upload failed. Please try again."));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, "Upload failed — the connection dropped."));
    xhr.send(form);
  });
}
