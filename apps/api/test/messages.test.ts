import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/plugins/database.js";
import { makeApp, registerAndLogin, resetDb } from "./helpers.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await makeApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await resetDb();
});

describe("direct researcher messages", () => {
  it("requires authentication for conversations", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/messages/conversations",
    });
    expect(response.statusCode).toBe(401);
  });

  it("starts a one-to-one conversation and sends messages", async () => {
    const sender = await registerAndLogin(app, 1);
    await registerAndLogin(app, 2);

    const started = await app.inject({
      method: "POST",
      url: "/messages/conversations",
      cookies: sender.cookie,
      payload: { username: "testuser2" },
    });
    expect(started.statusCode).toBe(200);
    const conversationId = started.json().conversationId;

    const sent = await app.inject({
      method: "POST",
      url: `/messages/conversations/${conversationId}/messages`,
      cookies: sender.cookie,
      payload: { body: "Would you like to discuss the study?" },
    });
    expect(sent.statusCode).toBe(201);

    const thread = await app.inject({
      method: "GET",
      url: `/messages/conversations/${conversationId}/messages`,
      cookies: sender.cookie,
    });
    expect(thread.statusCode).toBe(200);
    expect(thread.json().messages).toHaveLength(1);
    expect(thread.json().messages[0].body).toBe(
      "Would you like to discuss the study?",
    );
  });

  it("does not allow a researcher outside the conversation to read or send", async () => {
    const sender = await registerAndLogin(app, 1);
    await registerAndLogin(app, 2);
    const outsider = await registerAndLogin(app, 3);

    const started = await app.inject({
      method: "POST",
      url: "/messages/conversations",
      cookies: sender.cookie,
      payload: { username: "testuser2" },
    });
    const conversationId = started.json().conversationId;

    const read = await app.inject({
      method: "GET",
      url: `/messages/conversations/${conversationId}/messages`,
      cookies: outsider.cookie,
    });
    const sent = await app.inject({
      method: "POST",
      url: `/messages/conversations/${conversationId}/messages`,
      cookies: outsider.cookie,
      payload: { body: "Unauthorized" },
    });

    expect(read.statusCode).toBe(404);
    expect(sent.statusCode).toBe(404);
  });
});
