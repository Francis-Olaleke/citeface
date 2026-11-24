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

  app.get("/me/profile", async (request, reply) => {
    const token = request.cookies.citeface_session;
    if (!token) return reply.code(401).send({ error: "Authentication required" });
    const user = await getSessionUser(token);
    if (!user) {
      reply.clearCookie("citeface_session", { path: "/" });
      return reply.code(401).send({ error: "Your session is invalid or has expired" });
    }

    const [profile, affiliations] = await Promise.all([
      prisma.researcherProfile.findUnique({ where: { userId: user.id } }),
      prisma.userAffiliation.findMany({
        where: { userId: user.id },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        include: { affiliation: true },
      }),
    ]);

    return reply.send({ profile: profile ?? null, affiliations });
  });

  app.put<{
    Body: {
      headline?: string;
      biography?: string;
      country?: string;
      city?: string;
      websiteUrl?: string;
      linkedinUrl?: string;
      googleScholarUrl?: string;
      orcidId?: string;
      citationCount?: number;
      specializations?: string[];
      education?: Array<Record<string, unknown>>;
      grants?: Array<Record<string, unknown>>;
      fellowships?: Array<Record<string, unknown>>;
      professionalBodies?: Array<Record<string, unknown>>;
    };
  }>(
    "/me/profile",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          properties: {
            headline: { type: "string", maxLength: 180 },
            biography: { type: "string", maxLength: 5000 },
            country: { type: "string", maxLength: 100 },
            city: { type: "string", maxLength: 100 },
            websiteUrl: { type: "string", maxLength: 500 },
            linkedinUrl: { type: "string", maxLength: 500 },
            googleScholarUrl: { type: "string", maxLength: 500 },
            orcidId: { type: "string", maxLength: 19, pattern: "^\\d{4}-\\d{4}-\\d{4}-\\d{3}[\\dX]$" },
            citationCount: { type: "integer", minimum: 0, maximum: 100000000 },
            specializations: { type: "array", maxItems: 30, items: { type: "string", maxLength: 100 } },
            education: { type: "array", maxItems: 20, items: { type: "object" } },
            grants: { type: "array", maxItems: 50, items: { type: "object" } },
            fellowships: { type: "array", maxItems: 50, items: { type: "object" } },
            professionalBodies: { type: "array", maxItems: 50, items: { type: "object" } },
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

      const body = request.body;
      const profile = await prisma.researcherProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          headline: body.headline?.trim() || null,
          biography: body.biography?.trim() || null,
          country: body.country?.trim() || null,
          city: body.city?.trim() || null,
          websiteUrl: body.websiteUrl?.trim() || null,
          linkedinUrl: body.linkedinUrl?.trim() || null,
          googleScholarUrl: body.googleScholarUrl?.trim() || null,
          orcidId: body.orcidId?.trim() || null,
          citationCount: body.citationCount ?? 0,
          specializations: body.specializations ?? [],
          education: body.education ?? [],
          grants: body.grants ?? [],
          fellowships: body.fellowships ?? [],
          professionalBodies: body.professionalBodies ?? [],
        },
        update: {
          headline: body.headline?.trim() || null,
          biography: body.biography?.trim() || null,
          country: body.country?.trim() || null,
          city: body.city?.trim() || null,
          websiteUrl: body.websiteUrl?.trim() || null,
          linkedinUrl: body.linkedinUrl?.trim() || null,
          googleScholarUrl: body.googleScholarUrl?.trim() || null,
          orcidId: body.orcidId?.trim() || null,
          citationCount: body.citationCount ?? 0,
          specializations: body.specializations ?? [],
          education: body.education ?? [],
          grants: body.grants ?? [],
          fellowships: body.fellowships ?? [],
          professionalBodies: body.professionalBodies ?? [],
        },
      });

      return reply.send({ profile });
    },
  );

  app.get<{
    Querystring: ResearcherQuery & { q?: string };
  }>(
    "/",
    {
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            q: { type: "string", maxLength: 100 },
            page: { type: "integer", minimum: 1 },
            limit: { type: "integer", minimum: 1, maximum: 20 },
          },
        },
      },
    },
    async (request, reply) => {
      const page = request.query.page ?? 1;
      const limit = request.query.limit ?? 20;
      const search = request.query.q?.trim();

      const searchFilter = search
        ? {
            OR: [
              { displayName: { contains: search, mode: "insensitive" as const } },
              {
                researcherProfile: {
                  is: {
                    headline: { contains: search, mode: "insensitive" as const },
                  },
                },
              },
            ],
          }
        : {};

      const where = {
        status: "ACTIVE" as const,
        deletedAt: null,
        createdStories: {
          some: {
            status: "PUBLISHED" as const,
            publishedAt: { not: null },
            deletedAt: null,
            retractedAt: null,
            retraction: { is: null },
          },
        },
        ...searchFilter,
      };

      const [researchers, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: {
            id: true,
            username: true,
            displayName: true,
            createdAt: true,
            _count: {
              select: {
                followers: true,
                following: true,
              },
            },
            researcherProfile: {
              select: {
                headline: true,
                profileImageUrl: true,
                country: true,
                city: true,
                isVerified: true,
              },
            },
            _count: {
              select: {
                followers: true,
              },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      const researcherIds = researchers.map((researcher) => researcher.id);
      const publishedCounts = researcherIds.length
        ? await prisma.researchStory.groupBy({
            by: ["creatorId"],
            where: {
              creatorId: { in: researcherIds },
              status: "PUBLISHED",
              publishedAt: { not: null },
              deletedAt: null,
              retractedAt: null,
              retraction: { is: null },
            },
            _count: { _all: true },
          })
        : [];
      const countsByCreator = new Map(
        publishedCounts.map((item) => [item.creatorId, item._count._all]),
      );

      const items = researchers.map(({ id, _count, ...researcher }) => ({
        ...researcher,
        publicationCount: countsByCreator.get(id) ?? 0,
        followerCount: _count.followers,
      }));

      const totalPages = Math.ceil(total / limit);

      return reply.send({
        researchers: items,
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

  app.post<{ Params: ResearcherParams }>(
    "/:username/follow",
    {
      schema: {
        params: {
          type: "object",
          required: ["username"],
          additionalProperties: false,
          properties: {
            username: { type: "string", minLength: 1, maxLength: 30 },
          },
        },
      },
    },
    async (request, reply) => {
      const token = request.cookies.citeface_session;
      if (!token) {
        return reply.code(401).send({ error: "Authentication required" });
      }

      const follower = await getSessionUser(token);
      if (!follower) {
        reply.clearCookie("citeface_session", { path: "/" });
        return reply.code(401).send({ error: "Your session is invalid or has expired" });
      }

      const followed = await prisma.user.findFirst({
        where: {
          username: request.params.username,
          status: "ACTIVE",
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!followed) {
        return reply.code(404).send({ error: "Researcher not found" });
      }
      if (followed.id === follower.id) {
        return reply.code(400).send({ error: "You cannot follow your own profile" });
      }

      await prisma.userFollow.upsert({
        where: {
          followerId_followedId: {
            followerId: follower.id,
            followedId: followed.id,
          },
        },
        create: { followerId: follower.id, followedId: followed.id },
        update: {},
      });

      const followerCount = await prisma.userFollow.count({
        where: { followedId: followed.id },
      });

      return reply.send({ following: true, followerCount });
    },
  );

  app.delete<{ Params: ResearcherParams }>(
    "/:username/follow",
    {
      schema: {
        params: {
          type: "object",
          required: ["username"],
          additionalProperties: false,
          properties: {
            username: { type: "string", minLength: 1, maxLength: 30 },
          },
        },
      },
    },
    async (request, reply) => {
      const token = request.cookies.citeface_session;
      if (!token) {
        return reply.code(401).send({ error: "Authentication required" });
      }

      const follower = await getSessionUser(token);
      if (!follower) {
        reply.clearCookie("citeface_session", { path: "/" });
        return reply.code(401).send({ error: "Your session is invalid or has expired" });
      }

      const followed = await prisma.user.findFirst({
        where: {
          username: request.params.username,
          status: "ACTIVE",
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!followed) {
        return reply.code(404).send({ error: "Researcher not found" });
      }

      await prisma.userFollow.deleteMany({
        where: { followerId: follower.id, followedId: followed.id },
      });

      const followerCount = await prisma.userFollow.count({
        where: { followedId: followed.id },
      });

      return reply.send({ following: false, followerCount });
    },
  );

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
          _count: {
            select: {
              followers: true,
              following: true,
            },
          },
          researcherProfile: {
            select: {
              headline: true,
              biography: true,
              profileImageUrl: true,
              coverImageUrl: true,
              country: true,
              city: true,
              websiteUrl: true,
              linkedinUrl: true,
              googleScholarUrl: true,
              orcidId: true,
              citationCount: true,
              specializations: true,
              education: true,
              grants: true,
              fellowships: true,
              professionalBodies: true,
              stripeOnboardingComplete: true,
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

      const { id: researcherId, _count, ...publicResearcher } = researcher;
      const token = request.cookies.citeface_session;
      const viewer = token ? await getSessionUser(token) : null;
      const isFollowing = viewer
        ? (await prisma.userFollow.findUnique({
            where: {
              followerId_followedId: {
                followerId: viewer.id,
                followedId: researcherId,
              },
            },
            select: { id: true },
          })) !== null
        : false;

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
        researcher: {
          ...publicResearcher,
          followerCount: _count.followers,
          followingCount: _count.following,
          isFollowing,
        },
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

