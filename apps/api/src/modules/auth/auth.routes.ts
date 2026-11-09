import {
  requestPasswordReset,
  resetPassword,
} from "./password-reset.service.js";

import type { FastifyPluginAsync } from "fastify";
import {
  authenticateUser,
  createSession,
  getSessionUser,
  registerUser,
  revokeSession,
} from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";

const authRoutes: FastifyPluginAsync = async (app) => {
  // Register a new account.
  app.post(
  "/register",
  {
    schema: registerSchema,
    preValidation: async (request) => {
      const body = request.body as {
        email?: string;
        username?: string;
      };

      if (typeof body.email === "string") {
        body.email = body.email.trim();
      }

      if (typeof body.username === "string") {
        body.username = body.username.trim();
      }
    },
  },
  async (request, reply) => {
    const body = request.body as {
      email: string;
      password: string;
      displayName: string;
      username: string;
    };

    try {
      const user = await registerUser(body);

      const session = await createSession(user.id);

      reply.setCookie("citeface_session", session.token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: session.expiresAt,
      });

      return reply.code(201).send({
        message: "Account created successfully.",
        user,
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        return reply.code(409).send({
          error: "An account with that email or username already exists.",
        });
      }

      throw error;
    }
  });

  // Log in an existing user.
  app.post("/login", { schema: loginSchema }, async (request, reply) => {
    const body = request.body as {
      email: string;
      password: string;
    };

    const user = await authenticateUser(body.email, body.password);

    if (!user) {
      return reply.code(401).send({
        error: "Invalid email or password.",
      });
    }

    const session = await createSession(user.id);

    reply.setCookie("citeface_session", session.token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: session.expiresAt,
    });

    return {
      message: "Login successful.",
      user,
    };
  });

    // Request a password-reset email.
  app.post(
    "/forgot-password",
    {
      schema: {
        body: {
          type: "object",
          required: ["email"],
          additionalProperties: false,
          properties: {
            email: { type: "string", format: "email", maxLength: 254 },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as { email: string };

      try {
        await requestPasswordReset(body.email);
      } catch (error) {
        request.log.error(
          { err: error },
          "Password reset request could not be processed.",
        );
      }

      // Always return the same response to avoid revealing account existence.
      return reply.code(200).send({
        message:
          "If an account exists with that email, password reset instructions will be sent.",
      });
    },
  );

  // Reset a password using a valid, unused reset token.
  app.post(
    "/reset-password",
    {
      schema: {
        body: {
          type: "object",
          required: ["token", "password"],
          additionalProperties: false,
          properties: {
            token: {
              type: "string",
              pattern: "^[a-f0-9]{64}$",
            },
            password: {
              type: "string",
              minLength: 8,
              maxLength: 128,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as {
        token: string;
        password: string;
      };

      const success = await resetPassword(body.token, body.password);

      if (!success) {
        return reply.code(400).send({
          error: "This password reset link is invalid or has expired.",
        });
      }

      reply.clearCookie("citeface_session", { path: "/" });

      return reply.code(200).send({
        message:
          "Your password has been reset successfully. Please log in with your new password.",
      });
    },
  );

  // Get the currently authenticated user.
  app.get("/me", async (request, reply) => {
    const token = request.cookies.citeface_session;

    if (!token) {
      return reply.code(401).send({
        error: "You are not authenticated.",
      });
    }

    const user = await getSessionUser(token);

    if (!user) {
      reply.clearCookie("citeface_session", { path: "/" });

      return reply.code(401).send({
        error: "Your session is invalid or has expired.",
      });
    }

    return { user };
  });

  // Log out the current user.
  app.post("/logout", async (request, reply) => {
    const token = request.cookies.citeface_session;

    if (token) {
      await revokeSession(token);
    }

    reply.clearCookie("citeface_session", { path: "/" });

    return {
      message: "You have been logged out successfully.",
    };
  });
};

export default authRoutes;