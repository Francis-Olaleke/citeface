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
  },
  api: {
    resource: vi.fn(),
  },
}));

vi.mock("cloudinary", () => ({
  v2: cloudinaryMock,
}));

let app: FastifyInstance;

function nextUserNumber() {
  return randomInt(100_000_000, 2_000_000_000);
}

async function createIntent(
  mimeType: "image/png" | "video/mp4" = "image/png",
  sizeBytes = 1024,
) {
  const auth = await registerAndLogin(app, nextUserNumber());

  expect(auth.res.statusCode).toBe(201);

  const response = await app.inject({
    method: "POST",
    url: "/media/upload-intents",
    cookies: auth.cookie,
    payload: {
      originalName: mimeType === "image/png" ? "abstract.png" : "research.mp4",
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

  cloudinaryMock.config.mockClear();
  cloudinaryMock.utils.api_sign_request.mockReset();
  cloudinaryMock.utils.api_sign_request.mockReturnValue("mock-signature");
  cloudinaryMock.api.resource.mockReset();
});

afterAll(async () => {
  await app.close();
});

describe("F-08 Cloudinary media lifecycle", () => {
  it("creates a signed intent and persists an owner-bound private asset", async () => {
    const { auth, response } = await createIntent();

    expect(response.statusCode).toBe(201);

    const body = response.json();

    expect(body.mediaId).toBeTruthy();
    expect(body.publicId).toMatch(/^citeface\/story-media\//);
    expect(body.signature).toBe("mock-signature");
    expect(body.apiKey).toBe("test-api-key");
    expect(body.uploadType).toBe("authenticated");
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
    expect(cloudinaryMock.config).toHaveBeenCalled();

    // The session belongs to the same registered user whose intent was created.
    expect(auth.cookie.citeface_session).toBeTruthy();
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

  it.each([89, 301])(
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

  it.each([90, 300])(
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
