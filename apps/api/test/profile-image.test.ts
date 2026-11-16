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

describe("F-07 profile image security", () => {
  it("requires authentication to request an upload signature", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/researchers/me/profile-image/signature",
    });

    expect(response.statusCode).toBe(401);
  });

  it("requires authentication to confirm an uploaded image", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/researchers/me/profile-image/confirm",
      payload: {
        timestamp: Math.floor(Date.now() / 1000),
        intent: "a".repeat(64),
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it("requires authentication to remove a profile image", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: "/researchers/me/profile-image",
    });

    expect(response.statusCode).toBe(401);
  });

  it("rejects confirmation requests without an upload intent", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/researchers/me/profile-image/confirm",
      payload: {
        timestamp: Math.floor(Date.now() / 1000),
      },
    });

    expect(response.statusCode).toBe(400);
  });
});
