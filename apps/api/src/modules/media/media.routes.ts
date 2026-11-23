import type { FastifyPluginAsync } from "fastify";
import { getSessionUser } from "../auth/auth.service.js";
import {
  completeMediaUpload,
  getMediaUploadStatus,
  createMediaUploadIntent,
  MediaUploadError,
  processCloudinaryEagerNotification,
} from "./media.service.js";

const mediaRoutes: FastifyPluginAsync = async (app) => {
  app.post<{
    Body: {
      originalName: string;
      mimeType:
        | "image/jpeg"
        | "image/png"
        | "image/webp"
        | "video/mp4"
        | "video/quicktime"
        | "video/webm";
      sizeBytes: number;
    };
  }>(
    "/upload-intents",
    {
      schema: {
        body: {
          type: "object",
          required: ["originalName", "mimeType", "sizeBytes"],
          additionalProperties: false,
          properties: {
            originalName: { type: "string", minLength: 1, maxLength: 255 },
            mimeType: {
              type: "string",
              enum: [
                "image/jpeg",
                "image/png",
                "image/webp",
                "video/mp4",
                "video/quicktime",
                "video/webm",
              ],
            },
            sizeBytes: { type: "integer", minimum: 1 },
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
        const intent = await createMediaUploadIntent(user.id, request.body);
        return reply.code(201).send(intent);
      } catch (error) {
        if (error instanceof MediaUploadError) {
          return reply.code(error.statusCode).send({ error: error.message });
        }

        request.log.error({ err: error }, "Media upload intent failed.");
        return reply.code(503).send({
          error: "Media uploads are temporarily unavailable.",
        });
      }
    },
  );

  app.post<{
    Params: { mediaId: string };
  }>(
    "/:mediaId/complete",
    {
      schema: {
        params: {
          type: "object",
          required: ["mediaId"],
          properties: {
            mediaId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          additionalProperties: false,
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
        const result = await completeMediaUpload(user.id, request.params.mediaId);
        return reply.send(result);
      } catch (error) {
        if (error instanceof MediaUploadError) {
          return reply.code(error.statusCode).send({ error: error.message });
        }

        request.log.error({ err: error }, "Media upload completion failed.");
        return reply.code(503).send({
          error: "Media verification is temporarily unavailable.",
        });
      }
    },
  );

  app.get<{
    Params: { mediaId: string };
  }>(
    "/:mediaId",
    {
      schema: {
        params: {
          type: "object",
          required: ["mediaId"],
          properties: {
            mediaId: { type: "string", format: "uuid" },
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
        return reply.send(
          await getMediaUploadStatus(user.id, request.params.mediaId),
        );
      } catch (error) {
        if (error instanceof MediaUploadError) {
          return reply.code(error.statusCode).send({ error: error.message });
        }

        request.log.error({ err: error }, "Media status lookup failed.");
        return reply.code(503).send({
          error: "Media status is temporarily unavailable.",
        });
      }
    },
  );
  app.post(
    "/cloudinary/eager-notification",
    {
      config: { rawBody: true },
      bodyLimit: 1024 * 1024,
    },
    async (request, reply) => {
      const rawBody = (request as typeof request & {
        rawBody?: Buffer;
      }).rawBody;

      if (!Buffer.isBuffer(rawBody)) {
        return reply.code(400).send({
          error: "Raw notification body is unavailable.",
        });
      }

      try {
        const timestampHeader = request.headers["x-cld-timestamp"];
        const signatureHeader = request.headers["x-cld-signature"];

        const result = await processCloudinaryEagerNotification(
          rawBody,
          Array.isArray(timestampHeader) ? timestampHeader[0] : timestampHeader,
          Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader,
        );

        return reply.code(200).send(result);
      } catch (error) {
        if (error instanceof MediaUploadError) {
          return reply.code(error.statusCode).send({ error: error.message });
        }

        request.log.error({ err: error }, "Cloudinary eager notification failed.");
        return reply.code(503).send({
          error: "Cloudinary notification processing is temporarily unavailable.",
        });
      }
    },
  );};

export default mediaRoutes;
