const API_URL = "/api/researchers";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

interface UploadSignature {
  cloudName: string;
  apiKey: string;
  publicId: string;
  timestamp: number;
  overwrite: boolean;
  signature: string;
  intent: string;
}

interface ConfirmResponse {
  message: string;
  profileImageUrl: string;
}

async function readApiError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      message?: string;
      error?: string;
    };

    return data.message || data.error || "The request could not be completed.";
  } catch {
    return "The request could not be completed.";
  }
}

function validateImage(file: File): void {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Choose a JPEG, PNG or WebP image.");
  }

  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    throw new Error("The image must be larger than 0 bytes and no bigger than 10 MB.");
  }
}

export async function uploadProfileImage(file: File): Promise<string> {
  validateImage(file);

  const signatureResponse = await fetch(
    `${API_URL}/me/profile-image/signature`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!signatureResponse.ok) {
    throw new Error(await readApiError(signatureResponse));
  }

  const signature = (await signatureResponse.json()) as UploadSignature;

  if (
    !signature.cloudName ||
    !signature.apiKey ||
    !signature.publicId ||
    !signature.timestamp ||
    !signature.signature ||
    !signature.intent
  ) {
    throw new Error("The server returned an incomplete upload authorization.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("public_id", signature.publicId);
  formData.append("overwrite", String(signature.overwrite));
  formData.append("signature", signature.signature);

  const cloudinaryResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!cloudinaryResponse.ok) {
    throw new Error("Cloudinary could not upload the image. Please try again.");
  }

  const confirmResponse = await fetch(
    `${API_URL}/me/profile-image/confirm`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timestamp: signature.timestamp,
        intent: signature.intent,
      }),
    }
  );

  if (!confirmResponse.ok) {
    throw new Error(await readApiError(confirmResponse));
  }

  const result = (await confirmResponse.json()) as ConfirmResponse;

  if (
    typeof result.profileImageUrl !== "string" ||
    !result.profileImageUrl.startsWith("https://res.cloudinary.com/")
  ) {
    throw new Error("The server returned an invalid profile image URL.");
  }

  return result.profileImageUrl;
}

export async function removeProfileImage(): Promise<void> {
  const response = await fetch(`${API_URL}/me/profile-image`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}