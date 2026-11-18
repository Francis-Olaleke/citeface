import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "../../plugins/database.js";

const IMAGE_LIMIT = Number(
  process.env.CITEFACE_MEDIA_MAX_IMAGE_BYTES ?? 10 * 1024 * 1024,
);
const VIDEO_LIMIT = Number(
  process.env.CITEFACE_MEDIA_MAX_VIDEO_BYTES ?? 500 * 1024 * 1024,
);
const INTENT_TTL_SECONDS = Number(
  process.env.CITEFACE_MEDIA_UPLOAD_INTENT_TTL_SECONDS ?? 600,
);

const IMAGE_FORMATS = new Set(["jpg", "jpeg", "png", "webp"]);
const MIME_TYPES = {
  "image/jpeg": { type: "IMAGE" as const, resourceType: "image" as const, formats: ["jpg", "jpeg"] },
  "image/png": { type: "IMAGE" as const, resourceType: "image" as const, formats: ["png"] },
  "image/webp": { type: "IMAGE" as const, resourceType: "image" as const, formats: ["webp"] },
  "video/mp4": { type: "VIDEO" as const, resourceType: "video" as const, formats: ["mp4"] },
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
    INTENT_TTL_SECONDS < 60
  ) {
    throw new Error("Media upload configuration is invalid.");
  }

  return {
    imageLimit: IMAGE_LIMIT,
    videoLimit: VIDEO_LIMIT,
    intentTtlSeconds: INTENT_TTL_SECONDS,
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

  const signatureParams = {
    public_id: publicId,
    timestamp,
    type: "authenticated",
    overwrite: false,
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

  return {
    mediaId: record.id,
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    publicId,
    timestamp,
    signature,
    resourceType: media.resourceType,
    uploadType: "authenticated" as const,
    expiresAt: record.uploadExpiresAt,
    // The client uploads directly to Cloudinary. No delivery URL is returned.
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

  // The original MP4 is verified, but it is not READY until the
  // asynchronous 720p/480p transcode and thumbnail workflow completes.
  if (
    format !== "mp4" ||
    !Number.isFinite(asset.duration) ||
    asset.duration! < 90 ||
    asset.duration! > 300 ||
    !Number.isSafeInteger(asset.width) ||
    !Number.isSafeInteger(asset.height) ||
    (asset.width ?? 0) <= 0 ||
    (asset.height ?? 0) <= 0
  ) {
    throw new MediaUploadError(
      "The video must be an MP4 between 90 and 300 seconds with valid dimensions.",
    );
  }

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
      width: asset.width,
      height: asset.height,
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
