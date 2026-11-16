import type { FastifyPluginAsync } from "fastify";
import { getSessionUser } from "../auth/auth.service.js";
import {
  createProfileImageSignature,
  destroyProfileImage,
  verifyProfileImageAsset,
} from "./profile-image.service.js";
import { prisma } from "../../plugins/database.js";

interface ResearcherParams {
  username: string;
}

interface ResearcherQuery {
  page?: number;
  limit?: number;
}

const researchersRoutes: FastifyPluginAsync = async (app) => {

  app.post("/me/profile-image/signature", async (request, reply) => {
    const token = request.cookies.citeface_session;

    if (!token) {
      return reply.code(401).send({ error: "You are not authenticated." });
    }

    const user = await getSessionUser(token);

    if (!user) {
      reply.clearCookie("citeface_session", { path: "/" });
      return reply.code(401).send({
        error: "Your session is invalid or has expired.",
      });
    }

    try {
      return reply.send(
        createProfileImageSignature(user.id, Math.floor(Date.now() / 1000)),
      );
    } catch (error) {
      request.log.error({ err: error }, "Profile image signature failed.");
      return reply.code(503).send({
        error: "Profile image uploads are temporarily unavailable.",
      });
    }
  });

  app.post<{
    Body: { timestamp: number; intent: string };
  }>(
    "/me/profile-image/confirm",
    {
      schema: {
        body: {
          type: "object",
          required: ["timestamp", "intent"],
          additionalProperties: false,
          properties: {
            timestamp: { type: "integer", minimum: 1 },
            intent: {
              type: "string",
              minLength: 64,
              maxLength: 64,
              pattern: "^[a-f0-9]{64}$",
            },
          },
        },
      },
    },
    async (request, reply) => {
      const token = request.cookies.citeface_session;

      if (!token) {
        return reply.code(401).send({ error: "You are not authenticated." });
      }

      const user = await getSessionUser(token);

      if (!user) {
        reply.clearCookie("citeface_session", { path: "/" });
        return reply.code(401).send({
          error: "Your session is invalid or has expired.",
        });
      }

      try {
        const profileImageUrl = await verifyProfileImageAsset(
          user.id,
          request.body.timestamp,
          request.body.intent,
        );

        await prisma.researcherProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, profileImageUrl },
          update: { profileImageUrl },
        });

        return reply.send({
          message: "Profile photo updated successfully.",
          profileImageUrl,
        });
      } catch (error) {
        request.log.warn(
          { err: error },
          "Profile image confirmation failed.",
        );

        return reply.code(400).send({
          error: "The uploaded image could not be verified. Please try again.",
        });
      }
    },
  );

  app.delete("/me/profile-image", async (request, reply) => {
    const token = request.cookies.citeface_session;

    if (!token) {
      return reply.code(401).send({ error: "You are not authenticated." });
    }

    const user = await getSessionUser(token);

    if (!user) {
      reply.clearCookie("citeface_session", { path: "/" });
      return reply.code(401).send({
        error: "Your session is invalid or has expired.",
      });
    }

    try {
      const existing = await prisma.researcherProfile.findUnique({
        where: { userId: user.id },
        select: { profileImageUrl: true },
      });

      if (existing?.profileImageUrl) {
        const result = await destroyProfileImage(user.id);

        if (result.result !== "ok" && result.result !== "not found") {
          throw new Error("Cloudinary did not confirm image removal.");
        }
      }

      await prisma.researcherProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, profileImageUrl: null },
        update: { profileImageUrl: null },
      });

      return reply.send({
        message: "Profile photo removed successfully.",
      });
    } catch (error) {
      request.log.error({ err: error }, "Profile image removal failed.");
      return reply.code(503).send({
        error: "The profile photo could not be removed. Please try again.",
      });
    }
  });

  app.get<{
    Params: ResearcherParams;
    Querystring: ResearcherQuery;
  }>(
    "/:username",
    {
      schema: {
        params: {
          type: "object",
          required: ["username"],
          additionalProperties: false,
          properties: {
            username: {
              type: "string",
              minLength: 1,
              maxLength: 30,
            },
          },
        },
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            page: { type: "integer", minimum: 1 },
            limit: { type: "integer", minimum: 1, maximum: 20 },
          },
        },
      },
    },
    async (request, reply) => {
      const { username } = request.params;
      const page = request.query.page ?? 1;
      const limit = request.query.limit ?? 20;

      const researcher = await prisma.user.findFirst({
        where: {
          username,
          status: "ACTIVE",
          deletedAt: null,
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          createdAt: true,
          researcherProfile: {
            select: {
              headline: true,
              biography: true,
              profileImageUrl: true,
              coverImageUrl: true,
              country: true,
              city: true,
              websiteUrl: true,
              orcidId: true,
              isVerified: true,
            },
          },
          affiliations: {
            orderBy: [
              { isPrimary: "desc" },
              { createdAt: "asc" },
            ],
            select: {
              position: true,
              department: true,
              isPrimary: true,
              startDate: true,
              endDate: true,
              affiliation: {
                select: {
                  name: true,
                  slug: true,
                  type: true,
                  websiteUrl: true,
                  country: true,
                },
              },
            },
          },
        },
      });

      if (!researcher) {
        return reply.code(404).send({
          error: "Researcher not found",
        });
      }

      const { id: researcherId, ...publicResearcher } = researcher;

      const publishedStoryWhere = {
        creatorId: researcherId,
        status: "PUBLISHED" as const,
        publishedAt: { not: null },
        deletedAt: null,
        retractedAt: null,
        retraction: { is: null },
      };

      const [stories, total] = await Promise.all([
        prisma.researchStory.findMany({
          where: publishedStoryWhere,
          orderBy: [
            { publishedAt: "desc" },
            { id: "desc" },
          ],
          skip: (page - 1) * limit,
          take: limit,
          select: {
            slug: true,
            title: true,
            summary: true,
            classification: true,
            publishedAt: true,
            authors: {
              orderBy: { sortOrder: "asc" },
              select: {
                displayName: true,
                affiliationText: true,
                role: true,
              },
            },
          },
        }),
        prisma.researchStory.count({
          where: publishedStoryWhere,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return reply.send({
        researcher: publicResearcher,
        stories,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    },
  );
};

export default researchersRoutes;

