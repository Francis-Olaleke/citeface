
import type { FastifyPluginAsync } from "fastify";
import { randomUUID } from "node:crypto";
import { prisma } from "../../plugins/database.js";
import { getSessionUser } from "../auth/auth.service.js";
import {
  deleteCloudinaryStoryMedia,
  getMediaDeliveryUrl,
} from "../media/media.service.js";

type ResearchClassification =
  | "PEER_REVIEWED_ARTICLE"
  | "PREPRINT"
  | "THESIS_DISSERTATION"
  | "CONFERENCE_PAPER"
  | "RESEARCH_REPORT"
  | "AUTHOR_DESCRIBED_PROJECT"
  | "PRELIMINARY_UNPUBLISHED";

interface FeedQuery {
  page?: number;
  limit?: number;
  q?: string;
  classification?: ResearchClassification;
  topic?: string;
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

interface AttachStoryMediaBody {
  mediaAssetId: string;
  caption?: string;
}
interface PublishStoryBody {
  attestation: boolean;
  authors: {
    displayName: string;
    affiliationText?: string;
    role:
      | "LEAD_AUTHOR"
      | "CO_AUTHOR"
      | "CONTRIBUTOR"
      | "SUPERVISOR"
      | "ADVISER"
      | "OTHER";
    isCorresponding?: boolean;
  }[];
}


interface UpdateStoryBody {
  title?: string;
  summary?: string;
  classification?:
    | "PEER_REVIEWED_ARTICLE"
    | "PREPRINT"
    | "THESIS_DISSERTATION"
    | "CONFERENCE_PAPER"
    | "RESEARCH_REPORT"
    | "AUTHOR_DESCRIBED_PROJECT"
    | "PRELIMINARY_UNPUBLISHED";
  researchQuestion?: string | null;
  methodology?: string | null;
  findings?: string | null;
  significance?: string | null;
  limitations?: string | null;
  changeNote?: string;
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
  
  
      // Return attachments belonging to the authenticated researcher's draft.
  app.get<{
    Params: { id: string };
  }>(
    "/:id/media",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
      },
    },
    async (request, reply) => {
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

      const draft = await prisma.researchStory.findFirst({
        where: {
          id: request.params.id,
          creatorId: user.id,
          status: "DRAFT",
          deletedAt: null,
          publishedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!draft) {
        return reply.code(404).send({
          error: "Research draft not found",
        });
      }

      const attachments = await prisma.storyMedia.findMany({
        where: {
          storyId: draft.id,
          media: {
            deletedAt: null,
          },
        },
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          sortOrder: true,
          caption: true,
          createdAt: true,
          media: {
            select: {
              id: true,
              type: true,
              mimeType: true,
              width: true,
              height: true,
              durationSeconds: true,
              storageKey: true,
              processingStatus: true,
              processingErrorCode: true,
              createdAt: true,
              processedAt: true,
            },
          },
        },
      });

      return reply.send({
        attachments: attachments.map((attachment) => ({
          id: attachment.id,
          sortOrder: attachment.sortOrder,
          caption: attachment.caption,
          createdAt: attachment.createdAt,
          media: {
            id: attachment.media.id,
            type: attachment.media.type,
            mimeType: attachment.media.mimeType,
            width: attachment.media.width,
            height: attachment.media.height,
            durationSeconds: attachment.media.durationSeconds,
            status: attachment.media.processingStatus,
            errorCode: attachment.media.processingErrorCode,
            deliveryUrl:
              (attachment.media.processingStatus === "READY" ||
                (attachment.media.type === "VIDEO" &&
                  attachment.media.processingStatus === "PROCESSING")) &&
              (attachment.media.type === "IMAGE" ||
                attachment.media.type === "VIDEO")
                ? getMediaDeliveryUrl(
                    attachment.media.storageKey,
                    attachment.media.type,
                    attachment.media.mimeType,
                  )
                : null,
            createdAt: attachment.media.createdAt,
            processedAt: attachment.media.processedAt,
          },
        })),
      });
    },
  );
  app.put<{
    Params: { id: string; attachmentId: string };
    Body: { mediaAssetId: string };
  }>(
    "/:id/media/:attachmentId",
    {
      schema: {
        params: {
          type: "object",
          required: ["id", "attachmentId"],
          additionalProperties: false,
          properties: {
            id: { type: "string", format: "uuid" },
            attachmentId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["mediaAssetId"],
          additionalProperties: false,
          properties: {
            mediaAssetId: { type: "string", format: "uuid" },
          },
        },
      },
    },
    async (request, reply) => {
      const token = request.cookies.citeface_session;
      if (!token) {
        return reply.code(401).send({ error: "Authentication required" });
      }

      const user = await getSessionUser(token);
      if (!user) {
        reply.clearCookie("citeface_session", { path: "/" });
        return reply.code(401).send({ error: "Invalid or expired session" });
      }

      try {
        const result = await prisma.$transaction(async (tx) => {
          const draft = await tx.researchStory.findFirst({
            where: {
              id: request.params.id,
              creatorId: user.id,
              status: "DRAFT",
              deletedAt: null,
              publishedAt: null,
            },
            select: { id: true },
          });
          if (!draft) return { kind: "DRAFT_NOT_FOUND" as const };

          const current = await tx.storyMedia.findFirst({
            where: {
              id: request.params.attachmentId,
              storyId: draft.id,
              media: {
                uploadedById: user.id,
                deletedAt: null,
                storageProvider: "cloudinary",
              },
            },
            select: {
              id: true,
              sortOrder: true,
              caption: true,
              media: {
                select: {
                  id: true,
                  type: true,
                  storageKey: true,
                },
              },
            },
          });
          if (!current) return { kind: "ATTACHMENT_NOT_FOUND" as const };

          const replacement = await tx.mediaAsset.findFirst({
            where: {
              id: request.body.mediaAssetId,
              uploadedById: user.id,
              storageProvider: "cloudinary",
              deletedAt: null,
              processingStatus: { in: ["READY", "PROCESSING"] },
            },
            select: {
              id: true,
              type: true,
            },
          });
          if (!replacement) return { kind: "MEDIA_NOT_FOUND" as const };
          if (current.media.type !== replacement.type) {
            return { kind: "MEDIA_TYPE_MISMATCH" as const };
          }
          if (current.media.id === replacement.id) {
            return { kind: "SAME_MEDIA" as const };
          }

          const duplicate = await tx.storyMedia.findFirst({
            where: {
              storyId: draft.id,
              mediaAssetId: replacement.id,
            },
            select: { id: true },
          });
          if (duplicate) return { kind: "MEDIA_ALREADY_ATTACHED" as const };

          const currentReferences = await tx.storyMedia.count({
            where: { mediaAssetId: current.media.id },
          });
          if (current.media.type !== "IMAGE" && current.media.type !== "VIDEO") {
            return { kind: "UNSUPPORTED_MEDIA" as const };
          }

          await tx.storyMedia.update({
            where: { id: current.id },
            data: { mediaAssetId: replacement.id },
          });

          return {
            kind: "REPLACED" as const,
            sortOrder: current.sortOrder,
            caption: current.caption,
            oldMediaId: current.media.id,
            oldStorageKey: current.media.storageKey,
            oldMediaType: current.media.type,
            currentReferences,
          };
        });

        switch (result.kind) {
          case "DRAFT_NOT_FOUND":
          case "ATTACHMENT_NOT_FOUND":
            return reply.code(404).send({ error: "Draft media not found" });
          case "MEDIA_NOT_FOUND":
            return reply.code(404).send({ error: "Replacement media not found or not ready" });
          case "MEDIA_TYPE_MISMATCH":
            return reply.code(409).send({ error: "Replacement media must have the same type" });
          case "SAME_MEDIA":
            return reply.code(409).send({ error: "Choose a different media file to replace this attachment" });
          case "MEDIA_ALREADY_ATTACHED":
            return reply.code(409).send({ error: "This media is already attached to the draft" });
          case "UNSUPPORTED_MEDIA":
            return reply.code(409).send({ error: "This media cannot be replaced here" });
          case "REPLACED": {
            let cleanupWarning = false;
            if (result.currentReferences === 1) {
              try {
                await deleteCloudinaryStoryMedia(
                  result.oldStorageKey,
                  result.oldMediaType,
                );
                await prisma.mediaAsset.delete({
                  where: { id: result.oldMediaId },
                });
              } catch (error) {
                cleanupWarning = true;
                request.log.error(
                  { err: error, mediaId: result.oldMediaId },
                  "Replaced draft media could not be fully cleaned up.",
                );
              }
            }
            return reply.send({
              success: true,
              sortOrder: result.sortOrder,
              caption: result.caption,
              cleanupWarning,
            });
          }
        }
      } catch (error) {
        request.log.error({ err: error }, "Draft media replacement failed.");
        return reply.code(503).send({
          error: "Could not replace this media right now. Please try again.",
        });
      }
    },
  );
  app.delete<{
    Params: { id: string; attachmentId: string };
  }>(
    "/:id/media/:attachmentId",
    {
      schema: {
        params: {
          type: "object",
          required: ["id", "attachmentId"],
          additionalProperties: false,
          properties: {
            id: { type: "string", format: "uuid" },
            attachmentId: { type: "string", format: "uuid" },
          },
        },
      },
    },
    async (request, reply) => {
      const token = request.cookies.citeface_session;

      if (!token) {
        return reply.code(401).send({ error: "Authentication required" });
      }

      const user = await getSessionUser(token);

      if (!user) {
        reply.clearCookie("citeface_session", { path: "/" });
        return reply.code(401).send({ error: "Invalid or expired session" });
      }

      let result: { kind: "DRAFT_NOT_FOUND" | "ATTACHMENT_NOT_FOUND" | "UNSUPPORTED_MEDIA" | "REMOVED" };
      try {
        result = await prisma.$transaction(async (tx) => {
          const draft = await tx.researchStory.findFirst({
            where: {
              id: request.params.id,
              creatorId: user.id,
              status: "DRAFT",
              deletedAt: null,
              publishedAt: null,
            },
            select: { id: true },
          });

          if (!draft) return { kind: "DRAFT_NOT_FOUND" as const };

          const attachment = await tx.storyMedia.findFirst({
            where: {
              id: request.params.attachmentId,
              storyId: draft.id,
              media: {
                uploadedById: user.id,
                deletedAt: null,
                storageProvider: "cloudinary",
              },
            },
            select: {
              id: true,
              sortOrder: true,
              media: {
                select: {
                  id: true,
                  type: true,
                  storageKey: true,
                },
              },
            },
          });

          if (!attachment) return { kind: "ATTACHMENT_NOT_FOUND" as const };
          if (attachment.media.type !== "IMAGE" && attachment.media.type !== "VIDEO") {
            return { kind: "UNSUPPORTED_MEDIA" as const };
          }

          const assetAttachmentCount = await tx.storyMedia.count({
            where: { mediaAssetId: attachment.media.id },
          });
          if (assetAttachmentCount === 1) {
            await deleteCloudinaryStoryMedia(
              attachment.media.storageKey,
              attachment.media.type,
            );
          }

          await tx.storyMedia.delete({ where: { id: attachment.id } });
          if (assetAttachmentCount === 1) {
            await tx.mediaAsset.delete({ where: { id: attachment.media.id } });
          }

          const remaining = await tx.storyMedia.findMany({
            where: { storyId: draft.id },
            orderBy: { sortOrder: "asc" },
            select: { id: true, sortOrder: true },
          });

          for (const [sortOrder, item] of remaining.entries()) {
            if (item.sortOrder !== sortOrder) {
              await tx.storyMedia.update({
                where: { id: item.id },
                data: { sortOrder },
              });
            }
          }

          return { kind: "REMOVED" as const };
        });
      } catch (error) {
        request.log.error({ err: error }, "Draft media removal failed.");
        return reply.code(503).send({
          error: "Could not remove this media right now. Please try again.",
        });
      }

      if (result.kind === "DRAFT_NOT_FOUND" ||
          result.kind === "ATTACHMENT_NOT_FOUND") {
        return reply.code(404).send({ error: "Draft media not found" });
      }
      if (result.kind === "UNSUPPORTED_MEDIA") {
        return reply.code(409).send({ error: "This media cannot be removed here" });
      }

      return reply.send({ success: true });
    },
  );
      // Attach an owned, validated media asset to an owned research draft.
  app.post<{
    Params: { id: string };
    Body: AttachStoryMediaBody;
  }>(
    "/:id/media",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["mediaAssetId"],
          additionalProperties: false,
          properties: {
            mediaAssetId: { type: "string", format: "uuid" },
            caption: { type: "string", maxLength: 500 },
          },
        },
      },
    },
    async (request, reply) => {
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
          error: "Invalid or expired session",
        });
      }

      const { id: storyId } = request.params;
      const { mediaAssetId, caption } = request.body;

      const result = await prisma.$transaction(async (tx) => {
        const story = await tx.researchStory.findFirst({
          where: {
            id: storyId,
            creatorId: user.id,
            status: "DRAFT",
            deletedAt: null,
            publishedAt: null,
          },
          select: { id: true },
        });

        if (!story) {
          return { kind: "STORY_NOT_FOUND" as const };
        }

        const media = await tx.mediaAsset.findFirst({
          where: {
            id: mediaAssetId,
            uploadedById: user.id,
            deletedAt: null,
          },
          select: {
            id: true,
            type: true,
            mimeType: true,
            width: true,
            height: true,
            durationSeconds: true,
            processingStatus: true,
          },
        });

        if (!media) {
          return { kind: "MEDIA_NOT_FOUND" as const };
        }

        if (
          media.processingStatus !== "PROCESSING" &&
          media.processingStatus !== "READY"
        ) {
          return { kind: "MEDIA_NOT_ATTACHABLE" as const };
        }

        if (media.type !== "IMAGE" && media.type !== "VIDEO") {
          return { kind: "UNSUPPORTED_MEDIA" as const };
        }

        const existing = await tx.storyMedia.findMany({
          where: { storyId },
          select: {
            mediaAssetId: true,
            sortOrder: true,
            media: {
              select: { type: true },
            },
          },
        });

        if (existing.some((item) => item.mediaAssetId === media.id)) {
          return { kind: "MEDIA_ALREADY_ATTACHED" as const };
        }

        if (media.type === "IMAGE") {
          if (existing.some((item) => item.media.type === "VIDEO")) {
            return { kind: "INCOMPATIBLE_MEDIA" as const };
          }

          const imageCount = existing.filter(
            (item) => item.media.type === "IMAGE",
          ).length;

          if (imageCount >= 10) {
            return { kind: "IMAGE_LIMIT_REACHED" as const };
          }
        }

        if (media.type === "VIDEO" && existing.length > 0) {
          return { kind: "INCOMPATIBLE_MEDIA" as const };
        }

        const nextSortOrder =
          existing.length === 0
            ? 0
            : Math.max(...existing.map((item) => item.sortOrder)) + 1;

        const attachment = await tx.storyMedia.create({
          data: {
            storyId,
            mediaAssetId: media.id,
            sortOrder: nextSortOrder,
            caption: caption?.trim() || null,
          },
          select: {
            id: true,
            sortOrder: true,
            caption: true,
            createdAt: true,
            media: {
              select: {
                id: true,
                type: true,
                mimeType: true,
                width: true,
                height: true,
                durationSeconds: true,
                processingStatus: true,
              },
            },
          },
        });

        return { kind: "ATTACHED" as const, attachment };
      });

      switch (result.kind) {
        case "STORY_NOT_FOUND":
          return reply.code(404).send({
            error: "Research draft not found",
          });

        case "MEDIA_NOT_FOUND":
          return reply.code(404).send({
            error: "Media asset not found",
          });

        case "MEDIA_NOT_ATTACHABLE":
          return reply.code(409).send({
            error: "Media must be processing or ready before attachment",
            code: "MEDIA_NOT_ATTACHABLE",
          });

        case "UNSUPPORTED_MEDIA":
          return reply.code(400).send({
            error: "Only image and video media can be attached to a story",
            code: "UNSUPPORTED_STORY_MEDIA",
          });

        case "MEDIA_ALREADY_ATTACHED":
          return reply.code(409).send({
            error: "This media is already attached to the story",
            code: "STORY_MEDIA_ALREADY_ATTACHED",
          });

        case "INCOMPATIBLE_MEDIA":
          return reply.code(409).send({
            error: "A story can contain either images or one video, not both",
            code: "INCOMPATIBLE_STORY_MEDIA",
          });

        case "IMAGE_LIMIT_REACHED":
          return reply.code(409).send({
            error: "A story can contain a maximum of 10 images",
            code: "STORY_IMAGE_LIMIT",
          });

        case "ATTACHED":
          return reply.code(201).send({
            attachment: result.attachment,
          });
      }
    },
  );
// F-05.4: Publish a research story with explicit author attribution.
  app.post<{ Params: { id: string }; Body: PublishStoryBody }>(
    "/:id/publish",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          required: ["attestation", "authors"],
          additionalProperties: false,
          properties: {
            attestation: {
              type: "boolean",
              const: true,
            },
            authors: {
              type: "array",
              minItems: 1,
              maxItems: 20,
              items: {
                type: "object",
                required: ["displayName", "role"],
                additionalProperties: false,
                properties: {
                  displayName: {
                    type: "string",
                    minLength: 1,
                    maxLength: 200,
                  },
                  affiliationText: {
                    type: "string",
                    maxLength: 300,
                  },
                  role: {
                    type: "string",
                    enum: [
                      "LEAD_AUTHOR",
                      "CO_AUTHOR",
                      "CONTRIBUTOR",
                      "SUPERVISOR",
                      "ADVISER",
                      "OTHER",
                    ],
                  },
                  isCorresponding: {
                    type: "boolean",
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
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
          error: "Invalid or expired session",
        });
      }

      const { id } = request.params;
      const { authors } = request.body;

      // Require exactly one explicitly identified lead author.
      const leadAuthors = authors.filter(
        (author) => author.role === "LEAD_AUTHOR",
      );

      if (leadAuthors.length !== 1) {
        return reply.code(400).send({
          error: "A research story must have exactly one lead author",
        });
      }

      // Validate names after trimming whitespace.
      const normalizedAuthors = authors.map((author) => ({
        ...author,
        displayName: author.displayName.trim(),
        affiliationText: author.affiliationText?.trim() || null,
      }));

      if (normalizedAuthors.some((author) => !author.displayName)) {
        return reply.code(400).send({
          error: "Every author must have a valid display name",
        });
      }

      // Publish the story and save its authors atomically.
      const story = await prisma.$transaction(async (tx) => {
        // Confirm ownership and draft eligibility before inspecting attachments.
        const draft = await tx.researchStory.findFirst({
          where: {
            id,
            creatorId: user.id,
            status: "DRAFT",
            deletedAt: null,
            publishedAt: null,
          },
          select: { id: true },
        });

        if (!draft) {
          return null;
        }

        // Every attached asset must be active and fully processed.
        const attachments = await tx.storyMedia.findMany({
          where: { storyId: id },
          select: {
            media: {
              select: {
                processingStatus: true,
                deletedAt: true,
              },
            },
          },
        });

        const mediaNotReady = attachments.some(
          ({ media }) =>
            media.deletedAt !== null ||
            media.processingStatus !== "READY",
        );

        if (mediaNotReady) {
          return { mediaNotReady: true as const };
        }
        const publication = await tx.researchStory.updateMany({
          where: {
            id,
            creatorId: user.id,
            status: "DRAFT",
            deletedAt: null,
            publishedAt: null,
          },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
          },
        });

        // The story is not an eligible draft owned by this user.
        if (publication.count !== 1) {
          return null;
        }

        await tx.storyAuthor.createMany({
          data: normalizedAuthors.map((author, index) => ({
            storyId: id,
            displayName: author.displayName,
            affiliationText: author.affiliationText,
            role: author.role,
            sortOrder: index,
            isCorresponding: author.isCorresponding ?? false,
          })),
        });

        return tx.researchStory.findUnique({
          where: { id },
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
          },
        });
      });

      if (story && "mediaNotReady" in story) {
        return reply.code(409).send({
          error: "All attached media must finish processing before publication",
          code: "STORY_MEDIA_NOT_READY",
        });
      }

      if (!story) {
        return reply.code(404).send({
          error: "Draft not found or cannot be published",
        });
      }

      return reply.code(200).send({ story });
    },
  );

  // F-05.3: Update an existing private research draft.
  app.patch<{ Params: { id: string }; Body: UpdateStoryBody }>(
    "/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          minProperties: 1,
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
            researchQuestion: { type: ["string", "null"], maxLength: 10000 },
            methodology: { type: ["string", "null"], maxLength: 10000 },
            findings: { type: ["string", "null"], maxLength: 10000 },
            significance: { type: ["string", "null"], maxLength: 10000 },
            limitations: { type: ["string", "null"], maxLength: 10000 },
            changeNote: { type: "string", maxLength: 1000 },
          },
        },
      },
    },
    async (request, reply) => {
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

      const existing = await prisma.researchStory.findFirst({
        where: {
          id: request.params.id,
          creatorId: user.id,
          status: "DRAFT",
          deletedAt: null,
          publishedAt: null,
        },
      });

      if (!existing) {
        return reply.code(404).send({
          error: "Draft not found",
        });
      }

      const body = request.body;

      const title =
        body.title === undefined ? existing.title : body.title.trim();

      const summary =
        body.summary === undefined ? existing.summary : body.summary.trim();

      if (!title || !summary) {
        return reply.code(400).send({
          error: "Title and summary cannot be empty",
        });
      }

      const contentChanged =
        title !== existing.title ||
        summary !== existing.summary ||
        (body.classification !== undefined &&
          body.classification !== existing.classification) ||
        (body.researchQuestion !== undefined &&
          (body.researchQuestion?.trim() || null) !== existing.researchQuestion) ||
        (body.methodology !== undefined &&
          (body.methodology?.trim() || null) !== existing.methodology) ||
        (body.findings !== undefined &&
          (body.findings?.trim() || null) !== existing.findings) ||
        (body.significance !== undefined &&
          (body.significance?.trim() || null) !== existing.significance) ||
        (body.limitations !== undefined &&
          (body.limitations?.trim() || null) !== existing.limitations);

      if (!contentChanged) {
        return reply.code(400).send({
          error: "No research content changes were provided",
        });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const latestVersion = await tx.storyVersion.findFirst({
          where: { storyId: existing.id },
          orderBy: { versionNumber: "desc" },
          select: { versionNumber: true },
        });

        const versionNumber = (latestVersion?.versionNumber ?? 0) + 1;

        await tx.storyVersion.create({
          data: {
            storyId: existing.id,
            versionNumber,
            title: existing.title,
            summary: existing.summary,
            researchQuestion: existing.researchQuestion,
            methodology: existing.methodology,
            findings: existing.findings,
            significance: existing.significance,
            limitations: existing.limitations,
            changeNote: body.changeNote?.trim() || null,
            createdById: user.id,
          },
        });

        return tx.researchStory.update({
          where: { id: existing.id },
          data: {
            title,
            summary,
            classification: body.classification ?? existing.classification,
            ...(body.researchQuestion !== undefined && {
              researchQuestion: body.researchQuestion?.trim() || null,
            }),
            ...(body.methodology !== undefined && {
              methodology: body.methodology?.trim() || null,
            }),
            ...(body.findings !== undefined && {
              findings: body.findings?.trim() || null,
            }),
            ...(body.significance !== undefined && {
              significance: body.significance?.trim() || null,
            }),
            ...(body.limitations !== undefined && {
              limitations: body.limitations?.trim() || null,
            }),
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
      });

      return reply.send({ story: updated });
    },
  );

  // F-05.2: List the authenticated user's private drafts.
  app.get("/saved", async (request, reply) => {
    const token = request.cookies.citeface_session;
    if (!token) return reply.code(401).send({ error: "Authentication required" });
    const user = await getSessionUser(token);
    if (!user) {
      reply.clearCookie("citeface_session", { path: "/" });
      return reply.code(401).send({ error: "Your session is invalid or has expired" });
    }

    const saved = await prisma.savedItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        story: {
          include: {
            creator: {
              select: {
                id: true,
                displayName: true,
                username: true,
                researcherProfile: {
                  select: { headline: true, profileImageUrl: true, isVerified: true },
                },
              },
            },
            topics: { include: { topic: true } },
          },
        },
      },
    });

    return reply.send({
      stories: saved
        .map((item) => item.story)
        .filter((story) =>
          story.status === "PUBLISHED" &&
          story.deletedAt === null &&
          story.publishedAt !== null &&
          story.retractedAt === null,
        ),
    });
  });

  app.post<{ Params: { id: string } }>(
    "/:id/save",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          additionalProperties: false,
          properties: { id: { type: "string", format: "uuid" } },
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

      const story = await prisma.researchStory.findFirst({
        where: {
          id: request.params.id,
          status: "PUBLISHED",
          deletedAt: null,
          publishedAt: { not: null },
        },
        select: { id: true },
      });
      if (!story) return reply.code(404).send({ error: "Research story not found" });

      await prisma.savedItem.upsert({
        where: { userId_storyId: { userId: user.id, storyId: story.id } },
        create: { userId: user.id, storyId: story.id },
        update: {},
      });
      return reply.send({ saved: true });
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/:id/save",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          additionalProperties: false,
          properties: { id: { type: "string", format: "uuid" } },
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
      await prisma.savedItem.deleteMany({
        where: { userId: user.id, storyId: request.params.id },
      });
      return reply.send({ saved: false });
    },
  );

  app.get("/drafts", async (request, reply) => {
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
        error: "Invalid or expired session",
      });
    }

    const drafts = await prisma.researchStory.findMany({
      where: {
        creatorId: user.id,
        status: "DRAFT",
        deletedAt: null,
        publishedAt: null,
      },
      orderBy: [
        { updatedAt: "desc" },
        { id: "desc" },
      ],
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        classification: true,
        researchQuestion: true,
        methodology: true,
        findings: true,
        significance: true,
        limitations: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return reply.send({ drafts });
  });

  app.delete<{ Params: { id: string } }>(
    "/drafts/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          additionalProperties: false,
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
      },
    },
    async (request, reply) => {
      const token = request.cookies.citeface_session;

      if (!token) {
        return reply.code(401).send({ error: "Authentication required" });
      }

      const user = await getSessionUser(token);

      if (!user) {
        reply.clearCookie("citeface_session", { path: "/" });
        return reply.code(401).send({
          error: "Your session is invalid or has expired",
        });
      }

      const deleted = await prisma.$transaction(async (tx) => {
        const result = await tx.researchStory.updateMany({
          where: {
            id: request.params.id,
            creatorId: user.id,
            status: "DRAFT",
            deletedAt: null,
            publishedAt: null,
          },
          data: { deletedAt: new Date() },
        });

        if (result.count !== 1) {
          return false;
        }

        await tx.auditEvent.create({
          data: {
            actorId: user.id,
            action: "STORY_DRAFT_DELETED",
            entityType: "ResearchStory",
            entityId: request.params.id,
          },
        });

        return true;
      });

      if (!deleted) {
        return reply.code(404).send({
          error: "Not Found",
          message: "Research draft not found.",
        });
      }

      return reply.send({ success: true });
    },
  );

  // F-05.5: Edit a published story within the original 15-minute window.
  app.patch<{ Params: { id: string }; Body: UpdateStoryBody }>(
    "/:id/published",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          minProperties: 1,
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
            researchQuestion: { type: ["string", "null"], maxLength: 10000 },
            methodology: { type: ["string", "null"], maxLength: 10000 },
            findings: { type: ["string", "null"], maxLength: 10000 },
            significance: { type: ["string", "null"], maxLength: 10000 },
            limitations: { type: ["string", "null"], maxLength: 10000 },
            changeNote: { type: "string", maxLength: 2000 },
          },
        },
      },
    },
    async (request, reply) => {
      const token = request.cookies.citeface_session;

      if (!token) {
        return reply.code(401).send({ error: "Authentication required" });
      }

      const user = await getSessionUser(token);

      if (!user) {
        reply.clearCookie("citeface_session", { path: "/" });
        return reply.code(401).send({
          error: "Your session is invalid or has expired",
        });
      }

      const existing = await prisma.researchStory.findFirst({
        where: {
          id: request.params.id,
          creatorId: user.id,
          status: "PUBLISHED",
          deletedAt: null,
          archivedAt: null,
          retractedAt: null,
          retraction: { is: null },
        },
      });

      if (!existing) {
        return reply.code(404).send({
          error: "Not Found",
          message: "Research story not found.",
        });
      }

      const editWindowMs = 15 * 60 * 1000;

      if (
        !existing.publishedAt ||
        Date.now() - existing.publishedAt.getTime() >= editWindowMs
      ) {
        return reply.code(403).send({
          error: "Published story editing window has expired.",
        });
      }

      const body = request.body;
      const data: Record<string, unknown> = {};

      if (body.title !== undefined) data.title = body.title.trim();
      if (body.summary !== undefined) data.summary = body.summary.trim();
      if (body.classification !== undefined) {
        data.classification = body.classification;
      }

      for (const field of [
        "researchQuestion",
        "methodology",
        "findings",
        "significance",
        "limitations",
      ] as const) {
        if (body[field] !== undefined) {
          const value = body[field];
          data[field] = value === null ? null : value.trim() || null;
        }
      }

      if (data.title === "") {
        return reply.code(400).send({ error: "Title cannot be empty." });
      }

      if (data.summary === "") {
        return reply.code(400).send({ error: "Summary cannot be empty." });
      }

      if (Object.keys(data).length === 0) {
        return reply.code(400).send({
          error: "At least one story field must be changed.",
        });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const current = await tx.researchStory.findFirst({
          where: {
            id: existing.id,
            creatorId: user.id,
            status: "PUBLISHED",
            deletedAt: null,
            archivedAt: null,
            retractedAt: null,
            retraction: { is: null },
          },
        });

        if (
          !current ||
          !current.publishedAt ||
          Date.now() - current.publishedAt.getTime() >= editWindowMs
        ) {
          return null;
        }

        const latestVersion = await tx.storyVersion.findFirst({
          where: { storyId: current.id },
          orderBy: { versionNumber: "desc" },
          select: { versionNumber: true },
        });

        const versionNumber = (latestVersion?.versionNumber ?? 0) + 1;

        await tx.storyVersion.create({
          data: {
            storyId: current.id,
            versionNumber,
            title: current.title,
            summary: current.summary,
            researchQuestion: current.researchQuestion,
            methodology: current.methodology,
            findings: current.findings,
            significance: current.significance,
            limitations: current.limitations,
            changeNote: body.changeNote?.trim() || null,
            createdById: user.id,
          },
        });

        const result = await tx.researchStory.update({
          where: { id: current.id },
          data,
        });

        await tx.auditEvent.create({
          data: {
            actorId: user.id,
            action: "STORY_PUBLISHED_EDITED",
            entityType: "ResearchStory",
            entityId: current.id,
            metadata: {
              versionNumber,
              changeNote: body.changeNote?.trim() || null,
            },
          },
        });

        return result;
      });

      if (!updated) {
        return reply.code(403).send({
          error: "Published story editing window has expired.",
        });
      }

      return reply.send({ story: updated });
    },
  );

  // F-05.5: Soft-delete an owner's published research story.
  app.delete<{ Params: { id: string } }>(
    "/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
      },
    },
    async (request, reply) => {
      const token = request.cookies.citeface_session;

      if (!token) {
        return reply.code(401).send({ error: "Authentication required" });
      }

      const user = await getSessionUser(token);

      if (!user) {
        reply.clearCookie("citeface_session", { path: "/" });
        return reply.code(401).send({
          error: "Your session is invalid or has expired",
        });
      }

      const existing = await prisma.researchStory.findFirst({
        where: {
          id: request.params.id,
          creatorId: user.id,
          status: "PUBLISHED",
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!existing) {
        return reply.code(404).send({
          error: "Not Found",
          message: "Research story not found.",
        });
      }

      await prisma.$transaction(async (tx) => {
        const current = await tx.researchStory.findFirst({
          where: {
            id: existing.id,
            creatorId: user.id,
            status: "PUBLISHED",
            deletedAt: null,
          },
          select: { id: true },
        });

        if (!current) return false;

        await tx.researchStory.update({
          where: { id: current.id },
          data: { deletedAt: new Date() },
        });

        await tx.auditEvent.create({
          data: {
            actorId: user.id,
            action: "STORY_PUBLISHED_SOFT_DELETED",
            entityType: "ResearchStory",
            entityId: current.id,
          },
        });

        return true;
      }).then((deleted) => {
        if (!deleted) {
          throw new Error("Research story is no longer available.");
        }
      });

      return reply.send({ success: true });
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
          q: { type: "string", minLength: 1, maxLength: 200 },
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
          topic: { type: "string", minLength: 1, maxLength: 120 },
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
    

    const searchQuery = request.query.q?.trim();
    const classification = request.query.classification;
    const topicSlug = request.query.topic?.trim();

    const where = {
      status: "PUBLISHED" as const,
      deletedAt: null,
      publishedAt: { not: null },
      creator: {
        status: "ACTIVE" as const,
        deletedAt: null,
      },
      ...(classification ? { classification } : {}),
      ...(topicSlug
        ? { topics: { some: { topic: { slug: topicSlug } } } }
        : {}),
      ...(searchQuery
        ? {
            OR: [
              { title: { contains: searchQuery, mode: "insensitive" as const } },
              { summary: { contains: searchQuery, mode: "insensitive" as const } },
              { researchQuestion: { contains: searchQuery, mode: "insensitive" as const } },
              { methodology: { contains: searchQuery, mode: "insensitive" as const } },
              { findings: { contains: searchQuery, mode: "insensitive" as const } },
              { significance: { contains: searchQuery, mode: "insensitive" as const } },
              { limitations: { contains: searchQuery, mode: "insensitive" as const } },
            ],
          }
        : {}),
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
      storageKey: true,
      processingStatus: true,
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
      stories: stories.map((story) => ({
        ...story,
        media: story.media.map((attachment) => {
          const {
            storageKey,
            processingStatus,
            ...media
          } = attachment.media;

          return {
            ...attachment,
            media: {
              ...media,
              deliveryUrl:
                processingStatus === "READY" &&
                (media.type === "IMAGE" || media.type === "VIDEO")
                  ? getMediaDeliveryUrl(
                      storageKey,
                      media.type,
                      media.mimeType,
                    )
                  : null,
            },
          };
        }),
      })),
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

// F-06: Retrieve one publicly available research story by slug.
  app.get<{ Params: { slug: string } }>(
    "/:slug",
    async (request, reply) => {
      const { slug } = request.params;

      const story = await prisma.researchStory.findFirst({
        where: {
          slug,
          status: "PUBLISHED",
          publishedAt: { not: null },
          deletedAt: null,
          retractedAt: null,
          retraction: { is: null },
          creator: {
            status: "ACTIVE",
            deletedAt: null,
          },
        },
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          classification: true,
          researchQuestion: true,
          methodology: true,
          findings: true,
          significance: true,
          limitations: true,
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
                  storageKey: true,
                  processingStatus: true,
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
      });

      if (!story) {
        return reply.code(404).send({
          error: "Not Found",
          message: "Research story not found.",
        });
      }

      return reply.send({
        story: {
          ...story,
          media: story.media.map((attachment) => {
            const {
              storageKey,
              processingStatus,
              ...media
            } = attachment.media;

            return {
              ...attachment,
              media: {
                ...media,
                deliveryUrl:
                  processingStatus === "READY" &&
                  (media.type === "IMAGE" || media.type === "VIDEO")
                    ? getMediaDeliveryUrl(
                        storageKey,
                        media.type,
                        media.mimeType,
                      )
                    : null,
              },
            };
          }),
        },
      });
    },
  );
};

export default storiesRoutes;
