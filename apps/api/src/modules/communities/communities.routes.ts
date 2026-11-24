import type { FastifyPluginAsync } from "fastify";
import { getSessionUser } from "../auth/auth.service.js";
import { prisma } from "../../plugins/database.js";

const communitiesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request, reply) => {
    const q = typeof request.query === "object" && request.query && "q" in request.query
      ? String((request.query as { q?: string }).q ?? "").trim()
      : "";
    const where = {
      isPrivate: false,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { description: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    const communities = await prisma.community.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, username: true, displayName: true } },
        _count: { select: { members: true, posts: true } },
      },
    });
    return reply.send({ communities });
  });

  app.post<{ Body: { name: string; description: string } }>(
    "/",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "description"],
          additionalProperties: false,
          properties: {
            name: { type: "string", minLength: 3, maxLength: 100 },
            description: { type: "string", minLength: 10, maxLength: 3000 },
          },
        },
      },
    },
    async (request, reply) => {
      const token = request.cookies.citeface_session;
      if (!token) return reply.code(401).send({ error: "Authentication required" });
      const user = await getSessionUser(token);
      if (!user) {
        reply.clearCookie("citeface_session", { path: "/" });
        return reply.code(401).send({ error: "Your session is invalid or has expired" });
      }

      const name = request.body.name.trim();
      const base = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "community";
      let slug = base;
      let suffix = 2;
      while (await prisma.community.findUnique({ where: { slug } })) {
        slug = `${base}-${suffix++}`;
      }

      const community = await prisma.community.create({
        data: {
          name,
          slug,
          description: request.body.description.trim(),
          ownerId: user.id,
          members: {
            create: { userId: user.id, role: "OWNER" },
          },
        },
      });
      return reply.code(201).send({ community });
    },
  );

  app.post<{ Params: { slug: string } }>(
    "/:slug/join",
    {
      schema: {
        params: {
          type: "object",
          required: ["slug"],
          additionalProperties: false,
          properties: { slug: { type: "string", minLength: 1, maxLength: 100 } },
        },
      },
    },
    async (request, reply) => {
      const token = request.cookies.citeface_session;
      if (!token) return reply.code(401).send({ error: "Authentication required" });
      const user = await getSessionUser(token);
      if (!user) {
        reply.clearCookie("citeface_session", { path: "/" });
        return reply.code(401).send({ error: "Your session is invalid or has expired" });
      }
      const community = await prisma.community.findFirst({
        where: { slug: request.params.slug, isPrivate: false },
        select: { id: true },
      });
      if (!community) return reply.code(404).send({ error: "Community not found" });

      await prisma.communityMember.upsert({
        where: { communityId_userId: { communityId: community.id, userId: user.id } },
        create: { communityId: community.id, userId: user.id, role: "MEMBER" },
        update: { leftAt: null },
      });
      return reply.send({ joined: true });
    },
  );

  app.get<{ Params: { slug: string } }>(
    "/:slug",
    {
      schema: {
        params: {
          type: "object",
          required: ["slug"],
          additionalProperties: false,
          properties: { slug: { type: "string", minLength: 1, maxLength: 100 } },
        },
      },
    },
    async (request, reply) => {
      const community = await prisma.community.findFirst({
        where: { slug: request.params.slug, isPrivate: false },
        include: {
          owner: { select: { id: true, username: true, displayName: true } },
          _count: { select: { members: true, posts: true } },
          posts: {
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 50,
            include: {
              author: { select: { id: true, username: true, displayName: true } },
            },
          },
        },
      });
      if (!community) return reply.code(404).send({ error: "Community not found" });
      return reply.send({ community });
    },
  );

  app.post<{ Params: { slug: string }; Body: { body: string } }>(
    "/:slug/posts",
    {
      schema: {
        params: {
          type: "object",
          required: ["slug"],
          additionalProperties: false,
          properties: { slug: { type: "string", minLength: 1, maxLength: 100 } },
        },
        body: {
          type: "object",
          required: ["body"],
          additionalProperties: false,
          properties: { body: { type: "string", minLength: 1, maxLength: 5000 } },
        },
      },
    },
    async (request, reply) => {
      const token = request.cookies.citeface_session;
      if (!token) return reply.code(401).send({ error: "Authentication required" });
      const user = await getSessionUser(token);
      if (!user) {
        reply.clearCookie("citeface_session", { path: "/" });
        return reply.code(401).send({ error: "Your session is invalid or has expired" });
      }
      const community = await prisma.community.findFirst({
        where: { slug: request.params.slug, isPrivate: false },
        select: { id: true },
      });
      if (!community) return reply.code(404).send({ error: "Community not found" });

      const member = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: community.id, userId: user.id } },
      });
      if (!member || member.leftAt) return reply.code(403).send({ error: "Join this community before posting" });

      const post = await prisma.communityPost.create({
        data: {
          communityId: community.id,
          authorId: user.id,
          body: request.body.body.trim(),
        },
        include: {
          author: { select: { id: true, username: true, displayName: true } },
        },
      });
      return reply.code(201).send({ post });
    },
  );
};

export default communitiesRoutes;
