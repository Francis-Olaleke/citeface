import { createHmac, timingSafeEqual } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_INTENT_AGE_MS = 10 * 60 * 1000;
const ALLOWED_FORMATS = new Set(["jpg", "jpeg", "png", "webp"]);

export const PROFILE_IMAGE_MAX_BYTES = MAX_IMAGE_BYTES;

export function getProfileImageCloudinary() {
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

export function profileImagePublicId(userId: string) {
  return `citeface/profile-photos/${userId}/profile`;
}

function createIntent(userId: string, timestamp: number, secret: string) {
  return createHmac("sha256", secret)
    .update(`${userId}:${profileImagePublicId(userId)}:${timestamp}`)
    .digest("hex");
}

export function createProfileImageSignature(
  userId: string,
  timestamp: number,
) {
  const config = getProfileImageCloudinary();
  const publicId = profileImagePublicId(userId);

  const params = {
    public_id: publicId,
    timestamp,
    overwrite: true,
  };

  return {
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    publicId,
    timestamp,
    overwrite: true,
    signature: cloudinary.utils.api_sign_request(
      params,
      config.apiSecret,
    ),
    intent: createIntent(userId, timestamp, config.apiSecret),
  };
}

interface CloudinaryProfileAsset {
  public_id: string;
  resource_type: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  secure_url: string;
  version: number;
}

export async function verifyProfileImageAsset(
  userId: string,
  timestamp: number,
  intent: string,
) {
  const config = getProfileImageCloudinary();
  const publicId = profileImagePublicId(userId);
  const expectedIntent = createIntent(userId, timestamp, config.apiSecret);

  if (
    typeof intent !== "string" ||
    !/^[a-f0-9]{64}$/.test(intent) ||
    !timingSafeEqual(
      Buffer.from(expectedIntent, "hex"),
      Buffer.from(intent, "hex"),
    )
  ) {
    throw new Error("Invalid profile image upload authorization.");
  }

  const requestedTime = timestamp * 1000;
  const now = Date.now();

  if (
    !Number.isSafeInteger(timestamp) ||
    requestedTime > now + 60_000 ||
    now - requestedTime > MAX_INTENT_AGE_MS
  ) {
    throw new Error("Profile image upload authorization has expired.");
  }

  const asset = await cloudinary.api.resource(publicId, {
    resource_type: "image",
    type: "upload",
  }) as CloudinaryProfileAsset;

  const uploadVersionTime = asset.version * 1000;

  if (
    asset.public_id !== publicId ||
    asset.resource_type !== "image" ||
    !ALLOWED_FORMATS.has(asset.format?.toLowerCase()) ||
    !Number.isSafeInteger(asset.bytes) ||
    asset.bytes <= 0 ||
    asset.bytes > MAX_IMAGE_BYTES ||
    !Number.isSafeInteger(asset.width) ||
    !Number.isSafeInteger(asset.height) ||
    asset.width <= 0 ||
    asset.height <= 0 ||
    !Number.isSafeInteger(asset.version) ||
    asset.version <= 0 ||
    !Number.isFinite(uploadVersionTime) ||
    uploadVersionTime < requestedTime - 60_000 ||
    uploadVersionTime > now + 60_000 ||
    !asset.secure_url?.startsWith(
      `https://res.cloudinary.com/${config.cloudName}/image/upload/`,
    )
  ) {
    throw new Error("The uploaded image failed validation.");
  }

  return asset.secure_url;
}

export async function destroyProfileImage(userId: string) {
  getProfileImageCloudinary();

  return cloudinary.uploader.destroy(
    profileImagePublicId(userId),
    {
      resource_type: "image",
      type: "upload",
      invalidate: true,
    },
  );
}
