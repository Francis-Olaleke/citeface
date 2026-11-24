import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "../../plugins/database.js";

const IMAGE_LIMIT = Number(
  process.env.CITEFACE_MEDIA_MAX_IMAGE_BYTES ?? 10 * 1024 * 1024,
);
const VIDEO_LIMIT = Number(
  process.env.CITEFACE_MEDIA_MAX_VIDEO_BYTES ?? 500 * 1024 * 1024,
);
const CHUNK_SIZE_BYTES = Number(
  process.env.CITEFACE_MEDIA_CHUNK_SIZE_BYTES ?? 20 * 1024 * 1024,
);
const CHUNK_UPLOAD_THRESHOLD_BYTES = Number(
  process.env.CITEFACE_MEDIA_CHUNK_THRESHOLD_BYTES ?? 100 * 1024 * 1024,
);
const VIDEO_EAGER_TRANSFORMATIONS = [
  "c_limit,w_1280,h_720,vc_h264,q_auto:good,f_mp4",
  "c_limit,w_854,h_480,vc_h264,q_auto:good,f_mp4",
  "so_0,c_fill,w_640,h_360,g_auto,f_jpg",
].join("|");

function getEagerWebhookUrl() {
  const value = process.env.CITEFACE_CLOUDINARY_EAGER_WEBHOOK_URL;

  if (!value) {
    throw new MediaUploadError(
      "Video uploads require CITEFACE_CLOUDINARY_EAGER_WEBHOOK_URL to be set to a publicly reachable HTTPS endpoint.",
      503,
    );
  }

  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new MediaUploadError(
      "The configured video-processing webhook URL is invalid.",
      503,
    );
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1"
  ) {
    throw new MediaUploadError(
      "The video-processing webhook URL must be publicly reachable HTTPS.",
      503,
    );
  }

  return parsed.toString();
}
const INTENT_TTL_SECONDS = Number(
  process.env.CITEFACE_MEDIA_UPLOAD_INTENT_TTL_SECONDS ?? 600,
);

const IMAGE_FORMATS = new Set(["jpg", "jpeg", "png", "webp"]);
const MIME_TYPES = {
  "image/jpeg": { type: "IMAGE" as const, resourceType: "image" as const, formats: ["jpg", "jpeg"] },
  "image/png": { type: "IMAGE" as const, resourceType: "image" as const, formats: ["png"] },
  "image/webp": { type: "IMAGE" as const, resourceType: "image" as const, formats: ["webp"] },
  "video/mp4": { type: "VIDEO" as const, resourceType: "video" as const, formats: ["mp4"] },
  "video/quicktime": { type: "VIDEO" as const, resourceType: "video" as const, formats: ["mov"] },
  "video/webm": { type: "VIDEO" as const, resourceType: "video" as const, formats: ["webm"] },
};

export class MediaUploadError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = "MediaUploadError";
  }
}

export interface MediaUploadIntentInput {
  originalName: string;
  mimeType: keyof typeof MIME_TYPES;
  sizeBytes: number;
}

function getLimits() {
  if (
    !Number.isSafeInteger(IMAGE_LIMIT) ||
    IMAGE_LIMIT <= 0 ||
    !Number.isSafeInteger(VIDEO_LIMIT) ||
    VIDEO_LIMIT <= 0 ||
    !Number.isSafeInteger(INTENT_TTL_SECONDS) ||
    INTENT_TTL_SECONDS < 60 ||
    !Number.isSafeInteger(CHUNK_SIZE_BYTES) ||
    CHUNK_SIZE_BYTES <= 5 * 1024 * 1024 ||
    !Number.isSafeInteger(CHUNK_UPLOAD_THRESHOLD_BYTES) ||
    CHUNK_UPLOAD_THRESHOLD_BYTES <= 0
  ) {
    throw new Error("Media upload configuration is invalid.");
  }

  return {
    imageLimit: IMAGE_LIMIT,
    videoLimit: VIDEO_LIMIT,
    intentTtlSeconds: INTENT_TTL_SECONDS,
    chunkSizeBytes: CHUNK_SIZE_BYTES,
    chunkUploadThresholdBytes: CHUNK_UPLOAD_THRESHOLD_BYTES,
  };
}

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return { cloudName, apiKey, apiSecret };
}

function cleanOriginalName(value: string) {
  const name = value
    .replace(/[\\/]/g, "_")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 180);

  if (!name) {
    throw new MediaUploadError("A valid original filename is required.");
  }

  return name;
}

export async function createMediaUploadIntent(
  userId: string,
  input: MediaUploadIntentInput,
) {
  const limits = getLimits();
  const config = getCloudinaryConfig();
  const media = MIME_TYPES[input.mimeType];

  if (!media) {
    throw new MediaUploadError("This media format is not supported.");
  }

  const maximum = media.type === "IMAGE"
    ? limits.imageLimit
    : limits.videoLimit;

  if (
    !Number.isSafeInteger(input.sizeBytes) ||
    input.sizeBytes <= 0 ||
    input.sizeBytes > maximum
  ) {
    throw new MediaUploadError("The file exceeds the permitted upload size.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const expiresAt = new Date(
    (timestamp + limits.intentTtlSeconds) * 1000,
  );

  // Random, non-guessable asset identifier. Never use the user's filename.
  const publicId = `citeface/story-media/${randomUUID()}`;

  const eagerWebhookUrl = media.type === "VIDEO"
    ? getEagerWebhookUrl()
    : undefined;

  const signatureParams = {
    public_id: publicId,
    timestamp,
    overwrite: false,
    type: "authenticated",
    ...(media.type === "VIDEO"
      ? {
          eager: VIDEO_EAGER_TRANSFORMATIONS,
          eager_async: true,
          eager_notification_url: eagerWebhookUrl,
        }
      : {}),
  };

  const signature = cloudinary.utils.api_sign_request(
    signatureParams,
    config.apiSecret,
  );

  const record = await prisma.mediaAsset.create({
    data: {
      uploadedById: userId,
      type: media.type,
      storageKey: publicId,
      storageProvider: "cloudinary",
      originalName: cleanOriginalName(input.originalName),
      mimeType: input.mimeType,
      sizeBytes: BigInt(input.sizeBytes),
      processingStatus: "UPLOADING",
      uploadExpiresAt: expiresAt,
    },
    select: {
      id: true,
      processingStatus: true,
      uploadExpiresAt: true,
    },
  });

  const chunkUploadId = publicId.slice(publicId.lastIndexOf("/") + 1);
  const uploadUrl =
    `https://api.cloudinary.com/v1_1/${config.cloudName}/${media.resourceType}/upload`;

  return {
    mediaId: record.id,
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    publicId,
    timestamp,
    signature,
    resourceType: media.resourceType,
    uploadType: "authenticated" as const,
    uploadUrl,
    chunkUploadId,
    chunkSizeBytes: limits.chunkSizeBytes,
    requiresChunking:
      media.type === "VIDEO" &&
      input.sizeBytes > limits.chunkUploadThresholdBytes,
    ...(media.type === "VIDEO"
      ? {
          eager: VIDEO_EAGER_TRANSFORMATIONS,
          eager_async: true,
          eager_notification_url: eagerWebhookUrl,
        }
      : {}),
    expiresAt: record.uploadExpiresAt,
    // No media delivery URL is exposed by the upload-intent endpoint.
  };
}

export function getMediaDeliveryUrl(
  storageKey: string,
  type: "IMAGE" | "VIDEO",
  mimeType: string,
) {
  const config = getCloudinaryConfig();
  const format = type === "VIDEO" ? "mp4" : mimeType.split("/")[1];

  return cloudinary.url(storageKey, {
    resource_type: type === "VIDEO" ? "video" : "image",
    type: "authenticated",
    sign_url: true,
    secure: true,
    format,
  });
}

export async function deleteCloudinaryStoryMedia(
  storageKey: string,
  type: "IMAGE" | "VIDEO",
) {
  getCloudinaryConfig();

  if (!storageKey.startsWith("citeface/story-media/")) {
    throw new Error("Refusing to delete media outside the story-media namespace.");
  }

  const resourceType = type === "VIDEO" ? "video" : "image";
  const response = await cloudinary.api.delete_resources([storageKey], {
    resource_type: resourceType,
    type: "authenticated",
    invalidate: true,
  }) as { deleted?: Record<string, string> };

  const result = response.deleted?.[storageKey];

  if (result !== "deleted" && result !== "not_found") {
    throw new Error("Cloudinary did not confirm media deletion.");
  }
}

export async function getMediaUploadStatus(
  userId: string,
  mediaId: string,
) {
  const record = await prisma.mediaAsset.findFirst({
    where: {
      id: mediaId,
      uploadedById: userId,
      deletedAt: null,
    },
    select: {
      id: true,
      type: true,
      mimeType: true,
      width: true,
      height: true,
      durationSeconds: true,
      processingStatus: true,
      processingErrorCode: true,
      createdAt: true,
      processedAt: true,
    },
  });

  if (!record) {
    throw new MediaUploadError("Media asset was not found.", 404);
  }

  return {
    media: {
      id: record.id,
      type: record.type,
      mimeType: record.mimeType,
      width: record.width,
      height: record.height,
      durationSeconds: record.durationSeconds,
      status: record.processingStatus,
      errorCode: record.processingErrorCode,
      createdAt: record.createdAt,
      processedAt: record.processedAt,
    },
  };
}
interface CloudinaryAsset {
  public_id?: string;
  resource_type?: string;
  type?: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
}

export async function completeMediaUpload(
  userId: string,
  mediaId: string,
) {
  const record = await prisma.mediaAsset.findFirst({
    where: {
      id: mediaId,
      uploadedById: userId,
      deletedAt: null,
    },
  });

  if (!record) {
    throw new MediaUploadError("Media upload was not found.", 404);
  }

  if (record.processingStatus !== "UPLOADING") {
    throw new MediaUploadError("This upload is no longer awaiting completion.", 409);
  }

  if (!record.uploadExpiresAt || record.uploadExpiresAt.getTime() < Date.now()) {
    throw new MediaUploadError("The upload authorization has expired.", 410);
  }

  const config = getCloudinaryConfig();
  const expected = MIME_TYPES[record.mimeType as keyof typeof MIME_TYPES];

  if (!expected || expected.type !== record.type) {
    throw new MediaUploadError("The stored media declaration is invalid.");
  }

  let asset: CloudinaryAsset;

  try {
    asset = await cloudinary.api.resource(record.storageKey, {
      resource_type: expected.resourceType,
      type: "authenticated",
      ...(expected.type === "VIDEO" ? { media_metadata: true } : {}),
    }) as CloudinaryAsset;
  } catch {
    throw new MediaUploadError(
      "Cloudinary could not verify the uploaded asset. Check the upload and try again.",
    );
  }

  const format = asset.format?.toLowerCase() ?? "";
  const actualSize = asset.bytes;

  if (
    asset.public_id !== record.storageKey ||
    asset.resource_type !== expected.resourceType ||
    asset.type !== "authenticated" ||
    !Number.isSafeInteger(actualSize) ||
    actualSize! <= 0 ||
    BigInt(actualSize!) > record.sizeBytes ||
    BigInt(actualSize!) > BigInt(
      record.type === "IMAGE" ? IMAGE_LIMIT : VIDEO_LIMIT,
    )
  ) {
    throw new MediaUploadError("The uploaded asset failed server-side verification.");
  }

  if (record.type === "IMAGE") {
    if (
      !IMAGE_FORMATS.has(format) ||
      !expected.formats.includes(format) ||
      !Number.isSafeInteger(asset.width) ||
      !Number.isSafeInteger(asset.height) ||
      (asset.width ?? 0) <= 0 ||
      (asset.height ?? 0) <= 0
    ) {
      throw new MediaUploadError("The uploaded image format or dimensions are invalid.");
    }

    const updated = await prisma.mediaAsset.updateMany({
      where: {
        id: record.id,
        uploadedById: userId,
        processingStatus: "UPLOADING",
        deletedAt: null,
      },
      data: {
        processingStatus: "READY",
        width: asset.width,
        height: asset.height,
        sizeBytes: BigInt(actualSize!),
        processedAt: new Date(),
        uploadExpiresAt: null,
      },
    });

    if (updated.count !== 1) {
      throw new MediaUploadError("The upload state changed. Please refresh and retry.", 409);
    }

    return {
      mediaId: record.id,
      status: "READY" as const,
      message: "Image upload verified successfully.",
    };
  }

  // The original video is verified, but it is not READY until the
  // asynchronous 720p/480p transcode and thumbnail workflow completes.
  if (
    !expected.formats.includes(format) ||
    !Number.isFinite(asset.duration) ||
    asset.duration! < 90
  ) {
    throw new MediaUploadError(
      "The video must be MP4, MOV, or WebM and be at least 90 seconds long.",
    );
  }

  const width =
    Number.isSafeInteger(asset.width) && asset.width! > 0
      ? asset.width
      : undefined;
  const height =
    Number.isSafeInteger(asset.height) && asset.height! > 0
      ? asset.height
      : undefined;

  const updated = await prisma.mediaAsset.updateMany({
    where: {
      id: record.id,
      uploadedById: userId,
      processingStatus: "UPLOADING",
      deletedAt: null,
    },
    data: {
      processingStatus: "PROCESSING",
      processingStartedAt: new Date(),
      width,
      height,
      durationSeconds: Math.round(asset.duration!),
      sizeBytes: BigInt(actualSize!),
      uploadExpiresAt: null,
    },
  });

  if (updated.count !== 1) {
    throw new MediaUploadError("The upload state changed. Please refresh and retry.", 409);
  }

  return {
    mediaId: record.id,
    status: "PROCESSING" as const,
    message: "Video verified. Video processing is pending.",
  };
}

interface CloudinaryEagerResult {
  transformation?: string;
  status?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

interface CloudinaryEagerNotification {
  notification_type?: string;
  public_id?: string;
  resource_type?: string;
  type?: string;
  eager?: CloudinaryEagerResult[];
}

export async function processCloudinaryEagerNotification(
  rawBody: Buffer,
  timestampHeader: string | undefined,
  signatureHeader: string | undefined,
) {
  const config = getCloudinaryConfig();

  if (
    !timestampHeader ||
    !signatureHeader ||
    !/^\d{1,12}$/.test(timestampHeader)
  ) {
    throw new MediaUploadError("Invalid Cloudinary notification headers.", 401);
  }

  const timestamp = Number(timestampHeader);
  const maxAgeSeconds = Number(
    process.env.CITEFACE_CLOUDINARY_WEBHOOK_MAX_AGE_SECONDS ?? 7200,
  );

  if (
    !Number.isSafeInteger(maxAgeSeconds) ||
    maxAgeSeconds < 60 ||
    maxAgeSeconds > 86400
  ) {
    throw new Error("Cloudinary webhook timestamp configuration is invalid.");
  }

  const valid = cloudinary.utils.verifyNotificationSignature(
    rawBody.toString("utf8"),
    timestamp,
    signatureHeader,
    maxAgeSeconds,
  );

  if (!valid) {
    throw new MediaUploadError("Cloudinary notification signature is invalid or expired.", 401);
  }

  let notification: CloudinaryEagerNotification;

  try {
    notification = JSON.parse(rawBody.toString("utf8")) as CloudinaryEagerNotification;
  } catch {
    throw new MediaUploadError("Cloudinary notification body is invalid.", 400);
  }

  if (
    notification.notification_type !== "eager" ||
    !notification.public_id?.startsWith("citeface/story-media/") ||
    !Array.isArray(notification.eager)
  ) {
    throw new MediaUploadError("Unexpected Cloudinary notification payload.", 400);
  }

  const record = await prisma.mediaAsset.findFirst({
    where: {
      storageKey: notification.public_id,
      storageProvider: "cloudinary",
      type: "VIDEO",
      deletedAt: null,
    },
    select: {
      id: true,
      processingStatus: true,
    },
  });

  // A valid callback for an already removed or unknown asset is acknowledged.
  if (!record) {
    return { accepted: true, ignored: true };
  }

  // Conditional state transition makes repeated callbacks idempotent.
  if (record.processingStatus !== "PROCESSING") {
    return { accepted: true, duplicate: true };
  }

  const results = notification.eager;

  // Cloudinary omits status for successful eager transformations.
  // An explicit non-success status is treated as a failed transformation.
  const successful = results.filter((item) => {
    const status = item.status?.toLowerCase();
    return status === undefined || status === "success";
  });

  const failed = results.filter((item) => {
    const status = item.status?.toLowerCase();
    return status !== undefined && status !== "success";
  });

  const video720 = successful.find((item) =>
    item.format?.toLowerCase() === "mp4" &&
    item.transformation?.includes("h_720"),
  );

  const video480 = successful.find((item) =>
    item.format?.toLowerCase() === "mp4" &&
    item.transformation?.includes("h_480"),
  );

  const thumbnail = successful.find((item) =>
    item.format?.toLowerCase() === "jpg" &&
    item.transformation?.includes("f_jpg"),
  );

  const videoReady = Boolean(video720 || video480);
  const thumbnailReady = Boolean(thumbnail);
  const ready = videoReady && thumbnailReady;

  const metadata = {
    provider: "cloudinary",
    completedAt: new Date().toISOString(),
    renditions: {
      video720: video720
        ? {
            status: "READY",
            width: video720.width ?? null,
            height: video720.height ?? null,
            bytes: video720.bytes ?? null,
            format: video720.format ?? null,
          }
        : { status: "FAILED" },
      video480: video480
        ? {
            status: "READY",
            width: video480.width ?? null,
            height: video480.height ?? null,
            bytes: video480.bytes ?? null,
            format: video480.format ?? null,
          }
        : { status: "FAILED" },
      thumbnail: thumbnail
        ? {
            status: "READY",
            width: thumbnail.width ?? null,
            height: thumbnail.height ?? null,
            bytes: thumbnail.bytes ?? null,
            format: thumbnail.format ?? null,
          }
        : { status: "FAILED" },
    },
    failedTransformationCount: failed.length,
  };

  const result = await prisma.mediaAsset.updateMany({
    where: {
      id: record.id,
      processingStatus: "PROCESSING",
      deletedAt: null,
    },
    data: {
      processingStatus: ready ? "READY" : "FAILED",
      processingMetadata: metadata,
      processedAt: new Date(),
      processingErrorCode: ready
        ? null
        : !videoReady
          ? "VIDEO_RENDITIONS_FAILED"
          : "THUMBNAIL_GENERATION_FAILED",
    },
  });

  return {
    accepted: true,
    updated: result.count === 1,
    status: ready ? "READY" : "FAILED",
  };
}