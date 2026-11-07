import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/plugins/database.js";
import { makeApp, registerAndLogin, resetDb, userPayload } from "./helpers.js";

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

describe("F-01 registration", () => {
  it("creates one account and returns safe fields only", async () => {
    const res = await app.inject({ method: "POST", url: "/auth/register", payload: userPayload() });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.user.email).toBe("user1@example.com");
    expect(JSON.stringify(body)).not.toMatch(/passwordHash|argon2|password/i);
    expect(await prisma.user.count()).toBe(1);
  });

  it("stores an argon2id hash, never the plaintext", async () => {
    await app.inject({ method: "POST", url: "/auth/register", payload: userPayload() });
    const user = await prisma.user.findFirstOrThrow();
    expect(user.passwordHash).not.toBe("correct-horse-battery");
    expect(user.passwordHash?.startsWith("$argon2id$")).toBe(true);
  });

  it("normalises email and username", async () => {
    const p = { ...userPayload(), email: "  MiXed@Example.COM ", username: "MixedCase" };
    const res = await app.inject({ method: "POST", url: "/auth/register", payload: p });
    expect(res.statusCode).toBe(201);
    expect(res.json().user.email).toBe("mixed@example.com");
    expect(res.json().user.username).toBe("mixedcase");
  });

  it("rejects a duplicate email", async () => {
    await app.inject({ method: "POST", url: "/auth/register", payload: userPayload(1) });
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { ...userPayload(2), email: "user1@example.com" },
    });
    expect(res.statusCode).toBe(409);
  });

  it("rejects a duplicate username", async () => {
    await app.inject({ method: "POST", url: "/auth/register", payload: userPayload(1) });
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { ...userPayload(2), username: "testuser1" },
    });
    expect(res.statusCode).toBe(409);
  });

  it("produces exactly one account under concurrent duplicate registration", async () => {
    const results = await Promise.all([
      app.inject({ method: "POST", url: "/auth/register", payload: userPayload(1) }),
      app.inject({ method: "POST", url: "/auth/register", payload: userPayload(1) }),
    ]);
    const codes = results.map((r) => r.statusCode).sort();
    expect(codes).toEqual([201, 409]);
    expect(await prisma.user.count()).toBe(1);
  });

  it.each([
    ["missing displayName", { ...userPayload(), displayName: undefined }],
    ["invalid email", { ...userPayload(), email: "not-an-email" }],
    ["username too short", { ...userPayload(), username: "ab" }],
    ["username bad characters", { ...userPayload(), username: "bad name!" }],
    ["password too short", { ...userPayload(), password: "short" }],
    ["extra role property (mass assignment)", { ...userPayload(), role: "ADMIN" }],
  ])("rejects %s", async (_label, payload) => {
    const res = await app.inject({ method: "POST", url: "/auth/register", payload });
    expect(res.statusCode).toBe(400);
    expect(await prisma.user.count()).toBe(0);
  });
});

describe("F-02 login, logout, session", () => {
  it("logs in with correct credentials and sets a hardened cookie", async () => {
    await registerAndLogin(app);
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "user1@example.com", password: "correct-horse-battery" },
    });
    expect(res.statusCode).toBe(200);
    const cookie = res.cookies.find((c) => c.name === "citeface_session");
    expect(cookie?.httpOnly).toBe(true);
    expect(String(cookie?.sameSite).toLowerCase()).toBe("lax");
    expect(cookie?.path).toBe("/");
    expect(cookie?.expires).toBeTruthy();
  });

  it("gives the same generic error for a wrong password and an unknown account", async () => {
    await registerAndLogin(app);
    const wrong = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "user1@example.com", password: "wrong-password" },
    });
    const unknown = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "nobody@example.com", password: "wrong-password" },
    });
    expect(wrong.statusCode).toBe(401);
    expect(unknown.statusCode).toBe(401);
    expect(wrong.json()).toEqual(unknown.json());
  });

  it("rejects login with missing fields", async () => {
    const res = await app.inject({ method: "POST", url: "/auth/login", payload: { email: "a@b.co" } });
    expect(res.statusCode).toBe(400);
  });

  it("/me returns 401 without a session", async () => {
    const res = await app.inject({ method: "GET", url: "/auth/me" });
    expect(res.statusCode).toBe(401);
  });

  it("/me returns the user with a valid session and exposes no secrets", async () => {
    const { cookie } = await registerAndLogin(app);
    const res = await app.inject({ method: "GET", url: "/auth/me", cookies: cookie });
    expect(res.statusCode).toBe(200);
    expect(res.json().user.username).toBe("testuser1");
    expect(JSON.stringify(res.json())).not.toMatch(/passwordHash|tokenHash/i);
  });

  it("/me returns 401 for a forged token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/auth/me",
      cookies: { citeface_session: "forged-token" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("logout invalidates the session server-side", async () => {
    const { cookie } = await registerAndLogin(app);
    const out = await app.inject({ method: "POST", url: "/auth/logout", cookies: cookie });
    expect(out.statusCode).toBe(200);
    const me = await app.inject({ method: "GET", url: "/auth/me", cookies: cookie });
    expect(me.statusCode).toBe(401);
  });

  it("rejects an expired session", async () => {
    const { cookie } = await registerAndLogin(app);
    await prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    const me = await app.inject({ method: "GET", url: "/auth/me", cookies: cookie });
    expect(me.statusCode).toBe(401);
  });
});
