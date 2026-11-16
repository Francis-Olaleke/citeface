import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../../plugins/database.js";

interface ResearcherParams {
  username: string;
}

interface ResearcherQuery {
  page?: number;
  limit?: number;
}

const researchersRoutes: FastifyPluginAsync = async (app) => {
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