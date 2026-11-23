import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { randomInt } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { makeApp, registerAndLogin } from "./helpers.js";
import { prisma } from "../src/plugins/database.js";

const cloudinaryMock = vi.hoisted(() => ({
  config: vi.fn(),
  utils: {
    api_sign_request: vi.fn(),
    verifyNotificationSignature: vi.fn(),
  },
  api: {
    resource: vi.fn(),
  },
}));

vi.mock("cloudinary", () => ({
  v2: cloudinaryMock,
}));

type TestMediaMimeType =
  | "image/png"
  | "video/mp4"
  | "video/quicktime"
  | "video/webm"
  | "video/x-matroska"
  | "video/x-msvideo";

type TestVideoMimeType = Extract<TestMediaMimeType, `video/${string}`>;

const testFilenames: Record<TestMediaMimeType, string> = {
  "image/png": "abstract.png",
  "video/mp4": "research.mp4",
  "video/quicktime": "research.mov",
  "video/webm": "research.webm",
  "video/x-matroska": "research.mkv",
  "video/x-msvideo": "research.avi",
};

const testVideoFormats: Record<TestVideoMimeType, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-matroska": "mkv",
  "video/x-msvideo": "avi",
};

let app: FastifyInstance;

function nextUserNumber() {
  return randomInt(100_000_000, 2_000_000_000);
}

async function createIntent(
  mimeType: TestMediaMimeType = "image/png",
  sizeBytes = 1024,
) {
  const auth = await registerAndLogin(app, nextUserNumber());

  expect(auth.res.statusCode).toBe(201);

  const response = await app.inject({
    method: "POST",
    url: "/media/upload-intents",
    cookies: auth.cookie,
    payload: {
      originalName: testFilenames[mimeType],
      mimeType,
      sizeBytes,
    },
  });

  return { auth, response };
}

beforeAll(async () => {
  app = await makeApp();
});

beforeEach(() => {
  process.env.CLOUDINARY_CLOUD_NAME = "citeface-test";
  process.env.CLOUDINARY_API_KEY = "test-api-key";
  process.env.CLOUDINARY_API_SECRET = "test-api-secret";
  process.env.CITEFACE_CLOUDINARY_EAGER_WEBHOOK_URL =
    "https://example.com/api/media/cloudinary/eager-notification";

  cloudinaryMock.config.mockClear();
  cloudinaryMock.utils.api_sign_request.mockReset();
  cloudinaryMock.utils.api_sign_request.mockReturnValue("mock-signature");
  cloudinaryMock.utils.verifyNotificationSignature.mockReset();
  cloudinaryMock.utils.verifyNotificationSignature.mockReturnValue(true);
  cloudinaryMock.api.resource.mockReset();
});

afterAll(async () => {
  await app.close();
});

describe("F-08 Cloudinary media lifecycle", () => {
  it("explains that video uploads require a public HTTPS processing callback", async () => {
    const webhookUrl = process.env.CITEFACE_CLOUDINARY_EAGER_WEBHOOK_URL;
    delete process.env.CITEFACE_CLOUDINARY_EAGER_WEBHOOK_URL;

    try {
      const { response } = await createIntent("video/mp4");

      expect(response.statusCode).toBe(503);
      expect(response.json().error).toContain(
        "CITEFACE_CLOUDINARY_EAGER_WEBHOOK_URL",
      );
      expect(response.json().error).toContain("publicly reachable HTTPS");
    } finally {
      if (webhookUrl === undefined) {
        delete process.env.CITEFACE_CLOUDINARY_EAGER_WEBHOOK_URL;
      } else {
        process.env.CITEFACE_CLOUDINARY_EAGER_WEBHOOK_URL = webhookUrl;
      }
    }
  });

  async function createProcessingVideoForWebhook(mimeType: TestVideoMimeType = "video/mp4") {
    const { auth, response } = await createIntent(mimeType, 1024 * 1024);
    expect(response.statusCode).toBe(201);

    const intent = response.json();

    cloudinaryMock.api.resource.mockResolvedValue({
      public_id: intent.publicId,
      resource_type: "video",
      type: "authenticated",
      bytes: 1024 * 1024,
      format: testVideoFormats[mimeType],
      duration: 120,
      width: 1280,
      height: 720,
    });

    const completion = await app.inject({
      method: "POST",
      url: `/media/${intent.mediaId}/complete`,
      cookies: auth.cookie,
      payload: {},
    });

    expect(completion.statusCode).toBe(200);
    expect(completion.json().status).toBe("PROCESSING");

    return { mediaId: intent.mediaId, publicId: intent.publicId };
  }

  async function sendEagerNotification(payload: Record<string, unknown>) {
    const rawBody = JSON.stringify(payload);
    const timestamp = String(Math.floor(Date.now() / 1000));

    const response = await app.inject({
      method: "POST",
      url: "/media/cloudinary/eager-notification",
      headers: {
        "content-type": "application/json",
        "x-cld-timestamp": timestamp,
        "x-cld-signature": "test-webhook-signature",
      },
      payload: rawBody,
    });

    return { response, rawBody, timestamp };
  }

  const successfulEagerResults = [
    {
      transformation: "c_limit,w_1280,h_720,vc_h264,q_auto:good,f_mp4",
      format: "mp4",
      width: 1280,
      height: 720,
      bytes: 700000,
    },
    {
      transformation: "c_limit,w_854,h_480,vc_h264,q_auto:good,f_mp4",
      format: "mp4",
      width: 854,
      height: 480,
      bytes: 450000,
    },
    {
      transformation: "so_0,c_fill,w_640,h_360,g_auto,f_jpg",
      format: "jpg",
      width: 640,
      height: 360,
      bytes: 30000,
    },
  ];

  it("accepts documented Cloudinary eager callbacks without top-level resource_type or type", async () => {
    const { mediaId, publicId } = await createProcessingVideoForWebhook();

    const { response, rawBody, timestamp } = await sendEagerNotification({
      notification_type: "eager",
      public_id: publicId,
      eager: successfulEagerResults,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      accepted: true,
      updated: true,
      status: "READY",
    });

    expect(
      cloudinaryMock.utils.verifyNotificationSignature,
    ).toHaveBeenCalledWith(
      rawBody,
      Number(timestamp),
      "test-webhook-signature",
      7200,
    );

    const record = await prisma.mediaAsset.findUnique({
      where: { id: mediaId },
    });

    expect(record?.processingStatus).toBe("READY");
    expect(record?.processedAt).toBeInstanceOf(Date);
    expect(record?.processingErrorCode).toBeNull();
    expect(record?.processingMetadata).toMatchObject({
      provider: "cloudinary",
      failedTransformationCount: 0,
      renditions: {
        video720: { status: "READY", format: "mp4" },
        video480: { status: "READY", format: "mp4" },
        thumbnail: { status: "READY", format: "jpg" },
      },
    });
  });

  it.each([
    { mimeType: "video/mp4", format: "mp4" },
    { mimeType: "video/quicktime", format: "mov" },
    { mimeType: "video/webm", format: "webm" },
  ] as const)(
    "accepts $mimeType uploads and processes them to MP4 renditions",
    async ({ mimeType }) => {
      const { mediaId, publicId } = await createProcessingVideoForWebhook(mimeType);
      const notification = await sendEagerNotification({
        notification_type: "eager",
        public_id: publicId,
        eager: successfulEagerResults,
      });
      const media = await prisma.mediaAsset.findUniqueOrThrow({
        where: { id: mediaId },
      });

      expect(notification.response.statusCode).toBe(200);
      expect(notification.response.json().status).toBe("READY");
      expect(media.mimeType).toBe(mimeType);
      expect(media.processingStatus).toBe("READY");
    },
  );

  it("accepts a video when Cloudinary has not reported source dimensions", async () => {
    const { auth, response } = await createIntent("video/mp4", 1024 * 1024);
    const intent = response.json();

    cloudinaryMock.api.resource.mockResolvedValue({
      public_id: intent.publicId,
      resource_type: "video",
      type: "authenticated",
      format: "mp4",
      bytes: 1024 * 1024,
      duration: 120,
    });

    const completion = await app.inject({
      method: "POST",
      url: `/media/${intent.mediaId}/complete`,
      cookies: auth.cookie,
      payload: {},
    });

    expect(completion.statusCode).toBe(200);
    expect(completion.json().status).toBe("PROCESSING");

    const media = await prisma.mediaAsset.findUniqueOrThrow({
      where: { id: intent.mediaId },
    });
    expect(media.width).toBeNull();
    expect(media.height).toBeNull();
  });

  it.each(["video/x-matroska", "video/x-msvideo"] as const)(
    "does not yet accept %s uploads",
    async (mimeType) => {
      const { response } = await createIntent(mimeType);

      expect(response.statusCode).toBe(400);
    },
  );

  it("uses the successful 480p rendition when 720p generation fails", async () => {
    const { mediaId, publicId } = await createProcessingVideoForWebhook();

    const eager = [
      {
        transformation: "c_limit,w_1280,h_720,vc_h264,q_auto:good,f_mp4",
        format: "mp4",
        status: "failed",
        width: 1280,
        height: 720,
      },
      successfulEagerResults[1],
      successfulEagerResults[2],
    ];

    const { response } = await sendEagerNotification({
      notification_type: "eager",
      public_id: publicId,
      eager,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("READY");

    const record = await prisma.mediaAsset.findUnique({
      where: { id: mediaId },
    });

    expect(record?.processingStatus).toBe("READY");
    expect(record?.processingErrorCode).toBeNull();
    expect(record?.processingMetadata).toMatchObject({
      failedTransformationCount: 1,
      renditions: {
        video720: { status: "FAILED" },
        video480: { status: "READY" },
        thumbnail: { status: "READY" },
      },
    });
  });

  it("marks processing FAILED when both video renditions fail", async () => {
    const { mediaId, publicId } = await createProcessingVideoForWebhook();

    const eager = [
      {
        ...successfulEagerResults[0],
        status: "failed",
      },
      {
        ...successfulEagerResults[1],
        status: "failed",
      },
      successfulEagerResults[2],
    ];

    const { response } = await sendEagerNotification({
      notification_type: "eager",
      public_id: publicId,
      eager,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("FAILED");

    const record = await prisma.mediaAsset.findUnique({
      where: { id: mediaId },
    });

    expect(record?.processingStatus).toBe("FAILED");
    expect(record?.processingErrorCode).toBe("VIDEO_RENDITIONS_FAILED");
  });

  it("marks processing FAILED when thumbnail generation fails", async () => {
    const { mediaId, publicId } = await createProcessingVideoForWebhook();

    const eager = [
      successfulEagerResults[0],
      successfulEagerResults[1],
      {
        ...successfulEagerResults[2],
        status: "failed",
      },
    ];

    const { response } = await sendEagerNotification({
      notification_type: "eager",
      public_id: publicId,
      eager,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("FAILED");

    const record = await prisma.mediaAsset.findUnique({
      where: { id: mediaId },
    });

    expect(record?.processingStatus).toBe("FAILED");
    expect(record?.processingErrorCode).toBe("THUMBNAIL_GENERATION_FAILED");
  });

  it("rejects an invalid webhook signature without changing media state", async () => {
    const { mediaId, publicId } = await createProcessingVideoForWebhook();

    cloudinaryMock.utils.verifyNotificationSignature.mockReturnValue(false);

    const { response } = await sendEagerNotification({
      notification_type: "eager",
      public_id: publicId,
      eager: successfulEagerResults,
    });

    expect(response.statusCode).toBe(401);

    const record = await prisma.mediaAsset.findUnique({
      where: { id: mediaId },
    });

    expect(record?.processingStatus).toBe("PROCESSING");
    expect(record?.processedAt).toBeNull();
  });

  it("rejects notifications with missing signature headers", async () => {
    const { mediaId, publicId } = await createProcessingVideoForWebhook();

    const response = await app.inject({
      method: "POST",
      url: "/media/cloudinary/eager-notification",
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({
        notification_type: "eager",
        public_id: publicId,
        eager: successfulEagerResults,
      }),
    });

    expect(response.statusCode).toBe(401);
    expect(
      cloudinaryMock.utils.verifyNotificationSignature,
    ).not.toHaveBeenCalled();

    const record = await prisma.mediaAsset.findUnique({
      where: { id: mediaId },
    });

    expect(record?.processingStatus).toBe("PROCESSING");
  });

  it("acknowledges duplicate notifications without changing the completed asset", async () => {
    const { mediaId, publicId } = await createProcessingVideoForWebhook();

    const payload = {
      notification_type: "eager",
      public_id: publicId,
      eager: successfulEagerResults,
    };

    const first = await sendEagerNotification(payload);
    expect(first.response.statusCode).toBe(200);
    expect(first.response.json().status).toBe("READY");

    const beforeDuplicate = await prisma.mediaAsset.findUnique({
      where: { id: mediaId },
    });

    const second = await sendEagerNotification(payload);

    expect(second.response.statusCode).toBe(200);
    expect(second.response.json()).toMatchObject({
      accepted: true,
      duplicate: true,
    });

    const afterDuplicate = await prisma.mediaAsset.findUnique({
      where: { id: mediaId },
    });

    expect(afterDuplicate?.processingStatus).toBe("READY");
    expect(afterDuplicate?.processedAt?.getTime()).toBe(
      beforeDuplicate?.processedAt?.getTime(),
    );
  });

  it("acknowledges valid notifications for unknown assets without creating records", async () => {
    const { response } = await sendEagerNotification({
      notification_type: "eager",
      public_id: "citeface/story-media/unknown-webhook-asset",
      eager: successfulEagerResults,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      accepted: true,
      ignored: true,
    });
  });

  it("rejects unexpected notification types", async () => {
    const { mediaId } = await createProcessingVideoForWebhook();

    const { response } = await sendEagerNotification({
      notification_type: "upload",
      public_id: "citeface/story-media/unexpected",
      eager: successfulEagerResults,
    });

    expect(response.statusCode).toBe(400);

    const record = await prisma.mediaAsset.findUnique({
      where: { id: mediaId },
    });

    expect(record?.processingStatus).toBe("PROCESSING");
  });
  it("GET /media/:mediaId requires authentication", async () => {
    const { response } = await createIntent();

    const intent = response.json();

    const status = await app.inject({
      method: "GET",
      url: `/media/${intent.mediaId}`,
    });

    expect(status.statusCode).toBe(401);
  });

  it("GET /media/:mediaId returns owner-authorized processing status", async () => {
    const { auth, response } = await createIntent();

    const intent = response.json();

    const status = await app.inject({
      method: "GET",
      url: `/media/${intent.mediaId}`,
      cookies: auth.cookie,
    });

    expect(status.statusCode).toBe(200);
    expect(status.json()).toMatchObject({
      media: {
        id: intent.mediaId,
        type: "IMAGE",
        mimeType: "image/png",
        status: "UPLOADING",
      },
    });

    expect(status.json().media).not.toHaveProperty("storageKey");
    expect(status.json().media).not.toHaveProperty("storageProvider");
  });

  it("GET /media/:mediaId prevents another researcher from accessing media status", async () => {
    const { response } = await createIntent();

    const intent = response.json();
    const otherUser = await registerAndLogin(app, nextUserNumber());

    const status = await app.inject({
      method: "GET",
      url: `/media/${intent.mediaId}`,
      cookies: otherUser.cookie,
    });

    expect(status.statusCode).toBe(404);
  });
  it("creates a signed intent and persists an owner-bound private asset", async () => {
    const { auth, response } = await createIntent();

    expect(response.statusCode).toBe(201);

    const body = response.json();

    expect(body.mediaId).toBeTruthy();
    expect(body.publicId).toMatch(/^citeface\/story-media\//);
    expect(body.signature).toBe("mock-signature");
    expect(body.apiKey).toBe("test-api-key");
    expect(body.uploadType).toBe("authenticated");
    expect(body.uploadUrl).toBe(
      "https://api.cloudinary.com/v1_1/citeface-test/image/upload",
    );
    expect(body.chunkUploadId).toBe(
      body.publicId.slice(body.publicId.lastIndexOf("/") + 1),
    );
    expect(body.chunkSizeBytes).toBe(20 * 1024 * 1024);
    expect(body.requiresChunking).toBe(false);
    expect(body).not.toHaveProperty("secure_url");
    expect(body).not.toHaveProperty("deliveryUrl");

    const record = await prisma.mediaAsset.findUnique({
      where: { id: body.mediaId },
    });

    expect(record).not.toBeNull();
    expect(record?.uploadedById).toBeTruthy();
    expect(record?.processingStatus).toBe("UPLOADING");
    expect(record?.storageProvider).toBe("cloudinary");
    expect(record?.storageKey).toBe(body.publicId);
    expect(record?.type).toBe("IMAGE");
    expect(record?.uploadExpiresAt).toBeInstanceOf(Date);

    expect(cloudinaryMock.utils.api_sign_request).toHaveBeenCalledTimes(1);
    expect(cloudinaryMock.utils.api_sign_request).toHaveBeenCalledWith(
      {
        public_id: body.publicId,
        timestamp: expect.any(Number),
        overwrite: false,
        type: "authenticated",
      },
      "test-api-secret",
    );
    expect(cloudinaryMock.config).toHaveBeenCalled();

    // The session belongs to the same registered user whose intent was created.
    expect(auth.cookie.citeface_session).toBeTruthy();
  });

  it("issues chunk-upload instructions for videos larger than 100 MiB", async () => {
    const sizeBytes = 100 * 1024 * 1024 + 1;
    const { response } = await createIntent("video/mp4", sizeBytes);

    expect(response.statusCode).toBe(201);

    const body = response.json();

    expect(body.resourceType).toBe("video");
    expect(body.uploadUrl).toBe(
      "https://api.cloudinary.com/v1_1/citeface-test/video/upload",
    );
    expect(body.uploadType).toBe("authenticated");
    expect(body.chunkUploadId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(body.chunkSizeBytes).toBe(20 * 1024 * 1024);
    expect(body.requiresChunking).toBe(true);
    expect(body).not.toHaveProperty("deliveryUrl");
  });

  it("does not require chunking for a video at exactly 100 MiB", async () => {
    const { response } = await createIntent(
      "video/mp4",
      100 * 1024 * 1024,
    );

    expect(response.statusCode).toBe(201);
    expect(response.json().requiresChunking).toBe(false);
  });

  it("verifies an uploaded image and transitions it to READY", async () => {
    const { auth, response } = await createIntent();

    expect(response.statusCode).toBe(201);
    const intent = response.json();

    cloudinaryMock.api.resource.mockResolvedValue({
      public_id: intent.publicId,
      resource_type: "image",
      type: "authenticated",
      format: "png",
      bytes: 1024,
      width: 1200,
      height: 800,
    });

    const completion = await app.inject({
      method: "POST",
      url: `/media/${intent.mediaId}/complete`,
      cookies: auth.cookie,
      payload: {},
    });

    expect(completion.statusCode).toBe(200);
    expect(completion.json().status).toBe("READY");

    const record = await prisma.mediaAsset.findUnique({
      where: { id: intent.mediaId },
    });

    expect(record?.processingStatus).toBe("READY");
    expect(record?.width).toBe(1200);
    expect(record?.height).toBe(800);
    expect(record?.processedAt).toBeInstanceOf(Date);
    expect(record?.uploadExpiresAt).toBeNull();

    expect(cloudinaryMock.api.resource).toHaveBeenCalledWith(
      intent.publicId,
      {
        resource_type: "image",
        type: "authenticated",
      },
    );
  });

  it("does not allow another user to complete an upload", async () => {
    const { response } = await createIntent();
    const intent = response.json();

    const otherUser = await registerAndLogin(app, nextUserNumber());

    const completion = await app.inject({
      method: "POST",
      url: `/media/${intent.mediaId}/complete`,
      cookies: otherUser.cookie,
      payload: {},
    });

    expect(completion.statusCode).toBe(404);
    expect(cloudinaryMock.api.resource).not.toHaveBeenCalled();

    const record = await prisma.mediaAsset.findUnique({
      where: { id: intent.mediaId },
    });

    expect(record?.processingStatus).toBe("UPLOADING");
  });

  it("rejects an expired upload intent before contacting Cloudinary", async () => {
    const { auth, response } = await createIntent();
    const intent = response.json();

    await prisma.mediaAsset.update({
      where: { id: intent.mediaId },
      data: {
        uploadExpiresAt: new Date(Date.now() - 60_000),
      },
    });

    const completion = await app.inject({
      method: "POST",
      url: `/media/${intent.mediaId}/complete`,
      cookies: auth.cookie,
      payload: {},
    });

    expect(completion.statusCode).toBe(410);
    expect(cloudinaryMock.api.resource).not.toHaveBeenCalled();
  });

  it("rejects an actual Cloudinary asset larger than the declared file size", async () => {
    const { auth, response } = await createIntent("image/png", 1024);
    const intent = response.json();

    cloudinaryMock.api.resource.mockResolvedValue({
      public_id: intent.publicId,
      resource_type: "image",
      type: "authenticated",
      format: "png",
      bytes: 2048,
      width: 1200,
      height: 800,
    });

    const completion = await app.inject({
      method: "POST",
      url: `/media/${intent.mediaId}/complete`,
      cookies: auth.cookie,
      payload: {},
    });

    expect(completion.statusCode).toBe(400);

    const record = await prisma.mediaAsset.findUnique({
      where: { id: intent.mediaId },
    });

    expect(record?.processingStatus).toBe("UPLOADING");
  });

  it("rejects a Cloudinary resource with the wrong delivery type", async () => {
    const { auth, response } = await createIntent();
    const intent = response.json();

    cloudinaryMock.api.resource.mockResolvedValue({
      public_id: intent.publicId,
      resource_type: "image",
      type: "upload",
      format: "png",
      bytes: 1024,
      width: 1200,
      height: 800,
    });

    const completion = await app.inject({
      method: "POST",
      url: `/media/${intent.mediaId}/complete`,
      cookies: auth.cookie,
      payload: {},
    });

    expect(completion.statusCode).toBe(400);
  });

  it("rejects replayed completion after an image is READY", async () => {
    const { auth, response } = await createIntent();
    const intent = response.json();

    cloudinaryMock.api.resource.mockResolvedValue({
      public_id: intent.publicId,
      resource_type: "image",
      type: "authenticated",
      format: "png",
      bytes: 1024,
      width: 1200,
      height: 800,
    });

    const first = await app.inject({
      method: "POST",
      url: `/media/${intent.mediaId}/complete`,
      cookies: auth.cookie,
      payload: {},
    });

    expect(first.statusCode).toBe(200);

    const second = await app.inject({
      method: "POST",
      url: `/media/${intent.mediaId}/complete`,
      cookies: auth.cookie,
      payload: {},
    });

    expect(second.statusCode).toBe(409);
    expect(cloudinaryMock.api.resource).toHaveBeenCalledTimes(1);
  });

  it.each([89])(
    "rejects a video with duration %i seconds",
    async (duration) => {
      const { auth, response } = await createIntent("video/mp4", 1024 * 1024);
      const intent = response.json();

      cloudinaryMock.api.resource.mockResolvedValue({
        public_id: intent.publicId,
        resource_type: "video",
        type: "authenticated",
        format: "mp4",
        bytes: 1024 * 1024,
        width: 1920,
        height: 1080,
        duration,
      });

      const completion = await app.inject({
        method: "POST",
        url: `/media/${intent.mediaId}/complete`,
        cookies: auth.cookie,
        payload: {},
      });

      expect(completion.statusCode).toBe(400);

      const record = await prisma.mediaAsset.findUnique({
        where: { id: intent.mediaId },
      });

      expect(record?.processingStatus).toBe("UPLOADING");
    },
  );

  it.each([90, 300, 301])(
    "accepts a video with duration %i seconds into PROCESSING",
    async (duration) => {
      const { auth, response } = await createIntent("video/mp4", 1024 * 1024);
      const intent = response.json();

      cloudinaryMock.api.resource.mockResolvedValue({
        public_id: intent.publicId,
        resource_type: "video",
        type: "authenticated",
        format: "mp4",
        bytes: 1024 * 1024,
        width: 1920,
        height: 1080,
        duration,
      });

      const completion = await app.inject({
        method: "POST",
        url: `/media/${intent.mediaId}/complete`,
        cookies: auth.cookie,
        payload: {},
      });

      expect(completion.statusCode).toBe(200);
      expect(completion.json().status).toBe("PROCESSING");

      const record = await prisma.mediaAsset.findUnique({
        where: { id: intent.mediaId },
      });

      expect(record?.processingStatus).toBe("PROCESSING");
      expect(record?.durationSeconds).toBe(duration);
      expect(record?.processingStartedAt).toBeInstanceOf(Date);
      expect(record?.processedAt).toBeNull();
    },
  );
});
