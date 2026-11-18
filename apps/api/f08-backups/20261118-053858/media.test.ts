import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";
import type { FastifyInstance } from "fastify";
import { makeApp } from "./helpers.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await makeApp();
});

afterAll(async () => {
  await app.close();
});

describe("F-08 media upload security", () => {
  it("requires authentication to create an upload intent", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/media/upload-intents",
      payload: {
        originalName: "abstract.png",
        mimeType: "image/png",
        sizeBytes: 1024,
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it("requires authentication to complete an upload", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/media/00000000-0000-4000-8000-000000000001/complete",
      payload: {},
    });

    expect(response.statusCode).toBe(401);
  });

  it("rejects unsupported media formats at the API boundary", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/media/upload-intents",
      payload: {
        originalName: "animation.gif",
        mimeType: "image/gif",
        sizeBytes: 1024,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects missing upload intent fields", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/media/upload-intents",
      payload: {
        originalName: "abstract.png",
        mimeType: "image/png",
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects additional client-supplied upload properties", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/media/upload-intents",
      payload: {
        originalName: "abstract.png",
        mimeType: "image/png",
        sizeBytes: 1024,
        storageKey: "someone-elses-file",
        processingStatus: "READY",
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects malformed media identifiers", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/media/not-a-uuid/complete",
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });
});
