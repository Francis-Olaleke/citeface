import type { FastifyPluginAsync } from "fastify";
import { getSessionUser } from "../auth/auth.service.js";
import { prisma } from "../../plugins/database.js";

interface ConversationParams {
  id: string;
}

const messagesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/conversations", async (request, reply) => {
    const token = request.cookies.citeface_session;
    if (!token) {
      return reply.code(401).send({ error: "Authentication required" });
    }
    const user = await getSessionUser(token);
    if (!user) {
      reply.clearCookie("citeface_session", { path: "/" });
      return reply.code(401).send({ error: "Your session is invalid or has expired" });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        deletedAt: null,
        participants: { some: { userId: user.id, leftAt: null } },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        participants: {
          where: { leftAt: null },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                researcherProfile: {
                  select: { profileImageUrl: true, isVerified: true },
                },
              },
            },
          },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            body: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
    });

    const items = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await prisma.directMessage.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: user.id },
            readAt: null,
            deletedAt: null,
          },
        });
        return {
          id: conversation.id,
          updatedAt: conversation.updatedAt,
          participants: conversation.participants.map((participant) => participant.user),
          lastMessage: conversation.messages[0] ?? null,
          unreadCount,
        };
      }),
    );

    return reply.send({ conversations: items });
  });

  app.post<{ Body: { username: string } }>(
    "/conversations",
    {
      schema: {
        body: {
          type: "object",
          required: ["username"],
          additionalProperties: false,
          properties: { username: { type: "string", minLength: 1, maxLength: 30 } },
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

      const recipient = await prisma.user.findFirst({
        where: {
          username: request.body.username,
          status: "ACTIVE",
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!recipient) return reply.code(404).send({ error: "Researcher not found" });
      if (recipient.id === user.id) {
        return reply.code(400).send({ error: "You cannot start a conversation with yourself" });
      }

      let conversation = await prisma.conversation.findFirst({
        where: {
          deletedAt: null,
          AND: [
            { participants: { some: { userId: user.id, leftAt: null } } },
            { participants: { some: { userId: recipient.id, leftAt: null } } },
          ],
        },
        include: { participants: true },
      });

      if (conversation && conversation.participants.length !== 2) conversation = null;

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            participants: {
              create: [
                { userId: user.id },
                { userId: recipient.id },
              ],
            },
          },
          include: { participants: true },
        });
      }

      return reply.code(200).send({ conversationId: conversation.id });
    },
  );

  app.get<{ Params: ConversationParams }>(
    "/conversations/:id/messages",
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

      const participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId: request.params.id,
            userId: user.id,
          },
        },
        include: {
          conversation: {
            include: {
              participants: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                      displayName: true,
                      researcherProfile: {
                        select: { profileImageUrl: true, isVerified: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!participant || participant.leftAt || participant.conversation.deletedAt) {
        return reply.code(404).send({ error: "Conversation not found" });
      }

      const messages = await prisma.directMessage.findMany({
        where: { conversationId: request.params.id, deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          senderId: true,
          createdAt: true,
          readAt: true,
          editedAt: true,
        },
      });

      return reply.send({
        conversation: {
          id: participant.conversation.id,
          participants: participant.conversation.participants.map((item) => item.user),
        },
        messages,
      });
    },
  );

  app.post<{ Params: ConversationParams; Body: { body: string } }>(
    "/conversations/:id/messages",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          additionalProperties: false,
          properties: { id: { type: "string", format: "uuid" } },
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

      const body = request.body.body.trim();
      if (!body) return reply.code(400).send({ error: "Message cannot be empty" });

      const participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId: request.params.id,
            userId: user.id,
          },
        },
        include: { conversation: true },
      });
      if (!participant || participant.leftAt || participant.conversation.deletedAt) {
        return reply.code(404).send({ error: "Conversation not found" });
      }

      const message = await prisma.$transaction(async (tx) => {
        const created = await tx.directMessage.create({
          data: {
            conversationId: request.params.id,
            senderId: user.id,
            body,
          },
        });
        await tx.conversation.update({
          where: { id: request.params.id },
          data: { updatedAt: new Date() },
        });
        return created;
      });

      return reply.code(201).send({ message });
    },
  );

  app.patch<{ Params: ConversationParams }>(
    "/conversations/:id/read",
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

      const participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId: request.params.id,
            userId: user.id,
          },
        },
      });
      if (!participant || participant.leftAt) {
        return reply.code(404).send({ error: "Conversation not found" });
      }

      await prisma.directMessage.updateMany({
        where: {
          conversationId: request.params.id,
          senderId: { not: user.id },
          readAt: null,
          deletedAt: null,
        },
        data: { readAt: new Date() },
      });

      return reply.send({ success: true });
    },
  );
};

export default messagesRoutes;
