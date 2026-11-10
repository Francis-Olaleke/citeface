
import type { FastifyPluginAsync } from "fastify";
import { randomUUID } from "node:crypto";
import { prisma } from "../../plugins/database.js";
import { getSessionUser } from "../auth/auth.service.js";

interface FeedQuery {
  page?: number;
  limit?: number;
}

interface CreateStoryBody {
  title: string;
  summary: string;
  classification:
    | "PEER_REVIEWED_ARTICLE"
    | "PREPRINT"
    | "THESIS_DISSERTATION"
    | "CONFERENCE_PAPER"
    | "RESEARCH_REPORT"
    | "AUTHOR_DESCRIBED_PROJECT"
    | "PRELIMINARY_UNPUBLISHED";
  researchQuestion?: string;
  methodology?: string;
  findings?: string;
  significance?: string;
  limitations?: string;
}

const storiesRoutes: FastifyPluginAsync = async (app) => {
  // F-05: Create a private research story draft.
  app.post<{ Body: CreateStoryBody }>(
    "/",
    {
      schema: {
        body: {
          type: "object",
          required: ["title", "summary", "classification"],
          additionalProperties: false,
          properties: {
            title: { type: "string", minLength: 1, maxLength: 200 },
            summary: { type: "string", minLength: 1, maxLength: 500 },
            classification: {
              type: "string",
              enum: [
                "PEER_REVIEWED_ARTICLE",
                "PREPRINT",
                "THESIS_DISSERTATION",
                "CONFERENCE_PAPER",
                "RESEARCH_REPORT",
                "AUTHOR_DESCRIBED_PROJECT",
                "PRELIMINARY_UNPUBLISHED",
              ],
            },
            researchQuestion: { type: "string", maxLength: 10000 },
            methodology: { type: "string", maxLength: 10000 },
            findings: { type: "string", maxLength: 10000 },
            significance: { type: "string", maxLength: 10000 },
            limitations: { type: "string", maxLength: 10000 },
          },
        },
      },
    },
    async (request, reply) => {
      // Require an authenticated, active user.
      const token = request.cookies.citeface_session;

      if (!token) {
        return reply.code(401).send({
          error: "Authentication required",
        });
      }

      const user = await getSessionUser(token);

      if (!user) {
        reply.clearCookie("citeface_session", { path: "/" });

        return reply.code(401).send({
          error: "Your session is invalid or has expired",
        });
      }

      // Trim user input and reject empty values.
      const title = request.body.title.trim();
      const summary = request.body.summary.trim();

      if (!title || !summary) {
        return reply.code(400).send({
          error: "Title and summary cannot be empty",
        });
      }

      // Generate a readable, unique URL slug.
      const slugBase =
        title
          .toLowerCase()
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 80) || "research-story";

      const slug = `${slugBase}-${randomUUID().slice(0, 8)}`;

      // Save the story as a private draft.
      const story = await prisma.researchStory.create({
        data: {
          creatorId: user.id,
          title,
          slug,
          summary,
          classification: request.body.classification,
          researchQuestion:
            request.body.researchQuestion?.trim() || null,
          methodology: request.body.methodology?.trim() || null,
          findings: request.body.findings?.trim() || null,
          significance: request.body.significance?.trim() || null,
          limitations: request.body.limitations?.trim() || null,
          status: "DRAFT",
          publishedAt: null,
        },
        select: {
          id: true,
          creatorId: true,
          title: true,
          slug: true,
          summary: true,
          researchQuestion: true,
          methodology: true,
          findings: true,
          significance: true,
          limitations: true,
          classification: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return reply.code(201).send({ story });
    },
  );

  // F-04: Public discovery feed.
  app.get<{ Querystring: FeedQuery }>(
  "/feed",
  {
    schema: {
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1 },
          limit: { type: "integer", minimum: 1, maximum: 20 },
        },
        additionalProperties: false,
      },
    },
  },
  async (request, reply) => {
    const page = Math.max(1, Number(request.query.page) || 1);
    const limit = Math.min(
      20,
      Math.max(1, Number(request.query.limit) || 20),
    );

    const where = {
      status: "PUBLISHED" as const,
      deletedAt: null,
      publishedAt: { not: null },
      creator: {
        status: "ACTIVE" as const,
        deletedAt: null,
      },
    };

    const [stories, total] = await prisma.$transaction([
      prisma.researchStory.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          classification: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          creator: {
        select: {
          id: true,
          username: true,
          displayName: true,
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
        createdAt: true,
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
            },
          },
          _count: {
            select: {
              reactions: true,
              comments: true,
              questions: true,
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
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    });
  });
};

export default storiesRoutes;
