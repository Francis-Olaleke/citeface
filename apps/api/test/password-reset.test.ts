
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";

// Mock Resend so tests never send real emails.
const { sendEmailMock } = vi.hoisted(() => ({
  sendEmailMock: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: sendEmailMock,
    };

    constructor(_apiKey: string) {}
  },
}));

import { prisma } from "../src/plugins/database.js";
import {
  makeApp,
  registerAndLogin,
  resetDb,
} from "./helpers.js";

let app: FastifyInstance;

const originalEnv = {
  apiKey: process.env.RESEND_API_KEY,
  fromEmail: process.env.RESEND_FROM_EMAIL,
  webAppUrl: process.env.WEB_APP_URL,
};

function extractResetToken(): string {
  const email = sendEmailMock.mock.calls[0]?.[0] as {
    text?: string;
  };

  const match = email.text?.match(/[?&]token=([a-f0-9]{64})/);

  if (!match) {
    throw new Error("Reset token was not found in the mocked email.");
  }

  return match[1];
}

async function requestResetForUser() {
  const { payload, res, cookie } = await registerAndLogin(app);

  expect(res.statusCode).toBe(201);

  const response = await app.inject({
    method: "POST",
    url: "/auth/forgot-password",
    payload: { email: payload.email },
  });

  expect(response.statusCode).toBe(200);

  return {
    payload,
    cookie,
    response,
    token: extractResetToken(),
  };
}

beforeAll(async () => {
  process.env.RESEND_API_KEY = "test_api_key";
  process.env.RESEND_FROM_EMAIL = "Citeface <test@example.com>";
  process.env.WEB_APP_URL = "http://localhost:5173";

  app = await makeApp();
});

afterAll(async () => {
  await app.close();

  if (originalEnv.apiKey === undefined) {
    delete process.env.RESEND_API_KEY;
  } else {
    process.env.RESEND_API_KEY = originalEnv.apiKey;
  }

  if (originalEnv.fromEmail === undefined) {
    delete process.env.RESEND_FROM_EMAIL;
  } else {
    process.env.RESEND_FROM_EMAIL = originalEnv.fromEmail;
  }

  if (originalEnv.webAppUrl === undefined) {
    delete process.env.WEB_APP_URL;
  } else {
    process.env.WEB_APP_URL = originalEnv.webAppUrl;
  }
});

beforeEach(async () => {
  await resetDb();

  sendEmailMock.mockReset();
  sendEmailMock.mockResolvedValue({
    data: { id: "test-email-id" },
    error: null,
  });
});

describe("F-03 password recovery", () => {
  it("creates a hashed reset token and sends a reset email", async () => {
    const { payload, token } = await requestResetForUser();

    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    const email = sendEmailMock.mock.calls[0][0];

    expect(email.to).toBe(payload.email);
    expect(email.subject).toBe("Reset your Citeface password");
    expect(email.text).toContain(token);

    const record = await prisma.passwordResetToken.findFirstOrThrow();

    const expectedHash = createHash("sha256")
      .update(token)
      .digest("hex");

    expect(record.tokenHash).toBe(expectedHash);
    expect(record.tokenHash).not.toBe(token);
    expect(record.usedAt).toBeNull();
    expect(record.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("returns the same generic response for an unknown email", async () => {
    const { payload } = await registerAndLogin(app);

    const known = await app.inject({
      method: "POST",
      url: "/auth/forgot-password",
      payload: { email: payload.email },
    });

    sendEmailMock.mockClear();

    const unknown = await app.inject({
      method: "POST",
      url: "/auth/forgot-password",
      payload: { email: "unknown@example.com" },
    });

    expect(known.statusCode).toBe(200);
    expect(unknown.statusCode).toBe(200);
    expect(unknown.json()).toEqual(known.json());
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("rejects invalid and expired reset tokens", async () => {
    const invalid = await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      payload: {
        token: "a".repeat(64),
        password: "new-secure-password",
      },
    });

    expect(invalid.statusCode).toBe(400);

    const { token } = await requestResetForUser();

    const record = await prisma.passwordResetToken.findFirstOrThrow();

    await prisma.passwordResetToken.update({
      where: { id: record.id },
      data: {
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    const expired = await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      payload: {
        token,
        password: "new-secure-password",
      },
    });

    expect(expired.statusCode).toBe(400);
  });

  it("resets the password, revokes existing sessions and prevents token reuse", async () => {
    const { payload, cookie, token } = await requestResetForUser();

    const reset = await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      payload: {
        token,
        password: "new-secure-password",
      },
    });

    expect(reset.statusCode).toBe(200);

    const oldSession = await app.inject({
      method: "GET",
      url: "/auth/me",
      cookies: cookie,
    });

    expect(oldSession.statusCode).toBe(401);

    const oldLogin = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: payload.email,
        password: "correct-horse-battery",
      },
    });

    expect(oldLogin.statusCode).toBe(401);

    const newLogin = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: payload.email,
        password: "new-secure-password",
      },
    });

    expect(newLogin.statusCode).toBe(200);

    const reused = await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      payload: {
        token,
        password: "another-new-password",
      },
    });

    expect(reused.statusCode).toBe(400);
  });

  it("invalidates the previous reset link when a new one is requested", async () => {
    const { payload } = await registerAndLogin(app);

    await app.inject({
      method: "POST",
      url: "/auth/forgot-password",
      payload: { email: payload.email },
    });

    const firstToken = extractResetToken();

    sendEmailMock.mockClear();

    await app.inject({
      method: "POST",
      url: "/auth/forgot-password",
      payload: { email: payload.email },
    });

    const secondToken = extractResetToken();

    expect(secondToken).not.toBe(firstToken);

    const oldToken = await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      payload: {
        token: firstToken,
        password: "new-secure-password",
      },
    });

    expect(oldToken.statusCode).toBe(400);

    const newToken = await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      payload: {
        token: secondToken,
        password: "new-secure-password",
      },
    });

    expect(newToken.statusCode).toBe(200);
  });
});
