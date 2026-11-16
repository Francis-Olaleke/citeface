import Fastify from "fastify";
import cookie from "@fastify/cookie";

import { prisma } from "./plugins/database.js";
import authRoutes from "./modules/auth/auth.routes.js";
import storiesRoutes from "./modules/stories/stories.routes.js";

export async function buildApp(
  opts: { logger?: boolean; disconnectOnClose?: boolean } = {},
) {
  const { logger = true, disconnectOnClose = true } = opts;

const app = Fastify({
  logger,
  ajv: {
    customOptions: {
      removeAdditional: false,
    },
  },
});

  await app.register(cookie);
  await app.register(storiesRoutes, { prefix: "/stories" });

  app.decorate("prisma", prisma);

  if (disconnectOnClose) {
    app.addHook("onClose", async () => {
      await prisma.$disconnect();
    });
  }

  app.get("/health", async () => {
    return {
      status: "ok",
      application: "Citeface API",
      message: "Citeface development server is running.",
    };
  });

  app.get("/health/database", async () => {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: "ok",
      database: "connected",
      message: "Citeface database connection is working.",
    };
  });

  await app.register(authRoutes, { prefix: "/auth" });

  return app;
}
