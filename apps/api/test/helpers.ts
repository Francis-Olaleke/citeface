
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/plugins/database.js";

export async function makeApp(): Promise<FastifyInstance> {
  const app = await buildApp({
    logger: false,
    disconnectOnClose: false,
  });

  await app.ready();
  return app;
}

// Empties every table (except Prisma's migration log) between tests.
export async function resetDb(): Promise<void> {
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT quote_ident(tablename)::text AS tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `;

  if (rows.length > 0) {
    const list = rows.map((row) => row.tablename).join(", ");

    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`,
    );
  }
}

export function userPayload(n = 1) {
  return {
    email: `user${n}@example.com`,
    password: "correct-horse-battery",
    displayName: `Test User ${n}`,
    username: `testuser${n}`,
  };
}

export async function registerAndLogin(
  app: FastifyInstance,
  n = 1,
) {
  const payload = userPayload(n);

  const res = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload,
  });

  const cookie = res.cookies.find(
  (item) => item.name === "citeface_session"
);

const cookies: Record<string, string> = {};

if (cookie) {
  cookies.citeface_session = cookie.value;
}

return { payload, res, cookie: cookies };
}
