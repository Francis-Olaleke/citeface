import Fastify from "fastify";
import cookie from "@fastify/cookie";

import { prisma } from "./plugins/database.js";
import authRoutes from "./modules/auth/auth.routes.js";

const app = Fastify({
  logger: true,
});

// Register cookie support before authentication routes.
await app.register(cookie);

// Register Prisma database client.
app.decorate("prisma", prisma);

// Disconnect from the database when the server closes.
app.addHook("onClose", async () => {
  await prisma.$disconnect();
});

// Health-check endpoint.
app.get("/health", async () => {
  return {
    status: "ok",
    application: "Citeface API",
    message: "Citeface development server is running.",
  };
});

// Database connection health check.
app.get("/health/database", async () => {
  await prisma.$queryRaw`SELECT 1`;

  return {
    status: "ok",
    database: "connected",
    message: "Citeface database connection is working.",
  };
});

// Register authentication endpoints.
await app.register(authRoutes, {
  prefix: "/auth",
});

// Start the server.
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;

    await app.listen({
      port,
      host: "127.0.0.1",
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();