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
  app.post("/register", { schema: registerSchema }, async (request, reply) => {
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