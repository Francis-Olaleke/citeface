
import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../../plugins/database.js";

interface FeedQuery {
  page?: number;
  limit?: number;
}

const storiesRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: FeedQuery }>(
    "/feed",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 20, default: 20 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const page = request.query.page ?? 1;
      const limit = request.query.limit ?? 20;
      const skip = (page - 1) * limit;

      const where = {
        status: "PUBLISHED" as const,
        deletedAt: null,
        publishedAt: { not: null },
        creator: {
          is: {
            status: "ACTIVE" as const,
            deletedAt: null,
          },
        },
      };

      const [stories, total] = await Promise.all([
        prisma.researchStory.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            { publishedAt: "desc" },
            { id: "desc" },
          ],
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            researchQuestion: true,
            methodology: true,
            findings: true,
            significance: true,
            limitations: true,
            classification: true,
            publishedAt: true,
            createdAt: true,

            creator: {
              select: {
                id: true,
                displayName: true,
                username: true,
                researcherProfile: {
                  select: {
                    headline: true,
                    profileImageUrl: true,
                    isVerified: true,
                  },
                },
              },
            },

            authors: {
              orderBy: { sortOrder: "asc" },
              select: {
                id: true,
                displayName: true,
                affiliationText: true,
                role: true,
                sortOrder: true,
                isCorresponding: true,
              },
            },

            topics: {
              select: {
                topic: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },

            media: {
              where: {
                media: {
                  is: { deletedAt: null },
                },
              },
              orderBy: { sortOrder: "asc" },
              select: {
                id: true,
                sortOrder: true,
                caption: true,
                media: {
                  select: {
                    id: true,
                    type: true,
                    mimeType: true,
                    width: true,
                    height: true,
                    durationSeconds: true,
                  },
                },
              },
            },

            sources: {
              select: {
                id: true,
                type: true,
                title: true,
                doi: true,
                url: true,
                journal: true,
                publisher: true,
                publicationDate: true,
                authorsText: true,
                metadataConfirmed: true,
              },
            },

            _count: {
              select: {
                reactions: true,
                comments: {
                  where: { deletedAt: null },
                },
              },
            },
          },
        }),

        prisma.researchStory.count({ where }),
      ]);

      return reply.send({
        stories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: skip + stories.length < total,
          hasPreviousPage: page > 1,
        },
      });
    },
  );
};

export default storiesRoutes;