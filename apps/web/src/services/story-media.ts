const API = "/api";

export interface MediaUploadIntent {
  mediaId: string;
  cloudName: string;
  apiKey: string;
  publicId: string;
  timestamp: number;
  signature: string;
  resourceType: "image" | "video";
  uploadType: "authenticated";
  uploadUrl: string;
  chunkUploadId: string;
  chunkSizeBytes: number;
  requiresChunking: boolean;
  eager?: string;
  eager_async?: boolean;
  eager_notification_url?: string;
  expiresAt: string;
}

export interface DraftMediaAttachment {
  id: string;
  sortOrder: number;
  caption: string | null;
  createdAt: string;
  media: {
    id: string;
    type: "IMAGE" | "VIDEO";
    mimeType: string;
    width: number | null;
    height: number | null;
    durationSeconds: number | null;
    status: string;
    errorCode: string | null;
    deliveryUrl: string | null;
    createdAt: string;
    processedAt: string | null;
  };
}

export interface MediaUploadStatus {
  id: string;
  type: "IMAGE" | "VIDEO";
  status: string;
  errorCode: string | null;
}

export class StoryMediaError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "StoryMediaError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body !== undefined && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new StoryMediaError(
      result.error || "The media request failed.",
      response.status
    );
  }

  return result as T;
}

export async function getDraftMedia(
  storyId: string
): Promise<DraftMediaAttachment[]> {
  const result = await request<{
    attachments: DraftMediaAttachment[];
  }>(`/stories/${encodeURIComponent(storyId)}/media`);

  return result.attachments;
}

export async function removeDraftMedia(
  storyId: string,
  attachmentId: string,
): Promise<void> {
  await request(
    `/stories/${encodeURIComponent(storyId)}/media/${encodeURIComponent(attachmentId)}`,
    { method: "DELETE" },
  );
}

export async function replaceDraftMedia(
  storyId: string,
  attachmentId: string,
  file: File,
): Promise<{ cleanupWarning: boolean }> {
  const intent = await createUploadIntent(file);

  if (intent.requiresChunking) {
    await uploadChunked(file, intent);
  } else {
    await uploadSingle(file, intent);
  }

  await request(`/media/${encodeURIComponent(intent.mediaId)}/complete`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  const result = await request<{ cleanupWarning?: boolean }>(
    `/stories/${encodeURIComponent(storyId)}/media/${encodeURIComponent(attachmentId)}`,
    {
      method: "PUT",
      body: JSON.stringify({ mediaAssetId: intent.mediaId }),
    },
  );
  return { cleanupWarning: result.cleanupWarning === true };
}

export async function createUploadIntent(file: File) {
  return request<MediaUploadIntent>("/media/upload-intents", {
    method: "POST",
    body: JSON.stringify({
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  });
}

async function uploadSingle(
  file: File,
  intent: MediaUploadIntent
): Promise<void> {
  const form = new FormData();

  form.append("file", file);
  form.append("api_key", intent.apiKey);
  form.append("timestamp", String(intent.timestamp));
  form.append("public_id", intent.publicId);
  form.append("type", intent.uploadType);
  form.append("overwrite", "false");
  form.append("signature", intent.signature);

  if (intent.resourceType === "video") {
    if (intent.eager) form.append("eager", intent.eager);
    if (intent.eager_async !== undefined) {
      form.append("eager_async", String(intent.eager_async));
    }
    if (intent.eager_notification_url) {
      form.append(
        "eager_notification_url",
        intent.eager_notification_url
      );
    }
  }

  const response = await fetch(intent.uploadUrl, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    const message =
      typeof result.error?.message === "string"
        ? result.error.message
        : "Cloudinary upload failed.";
    throw new StoryMediaError(message);
  }
}

async function uploadChunked(
  file: File,
  intent: MediaUploadIntent
): Promise<void> {
  const chunkSize = intent.chunkSizeBytes;

  if (!Number.isSafeInteger(chunkSize) || chunkSize <= 0) {
    throw new StoryMediaError("Invalid upload chunk size.");
  }

  for (let start = 0; start < file.size; start += chunkSize) {
    const end = Math.min(start + chunkSize, file.size) - 1;
    const form = new FormData();

    form.append("file", file.slice(start, end + 1));
    form.append("api_key", intent.apiKey);
    form.append("timestamp", String(intent.timestamp));
    form.append("public_id", intent.publicId);
    form.append("type", intent.uploadType);
    form.append("overwrite", "false");
    form.append("signature", intent.signature);

    if (intent.eager) form.append("eager", intent.eager);
    if (intent.eager_async !== undefined) {
      form.append("eager_async", String(intent.eager_async));
    }
    if (intent.eager_notification_url) {
      form.append(
        "eager_notification_url",
        intent.eager_notification_url
      );
    }

    const response = await fetch(intent.uploadUrl, {
      method: "POST",
      body: form,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${file.size}`,
        "X-Unique-Upload-Id": intent.chunkUploadId,
      },
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      const message =
        typeof result.error?.message === "string"
          ? result.error.message
          : `Video upload failed at byte ${start}.`;
      throw new StoryMediaError(
        message
      );
    }
  }
}

export async function uploadMedia(
  storyId: string,
  file: File,
  caption: string
): Promise<void> {
  const intent = await createUploadIntent(file);

  if (intent.requiresChunking) {
    await uploadChunked(file, intent);
  } else {
    await uploadSingle(file, intent);
  }

  await request(`/media/${encodeURIComponent(intent.mediaId)}/complete`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  await request(`/stories/${encodeURIComponent(storyId)}/media`, {
    method: "POST",
    body: JSON.stringify({
      mediaAssetId: intent.mediaId,
      ...(caption.trim() ? { caption: caption.trim() } : {}),
    }),
  });
}