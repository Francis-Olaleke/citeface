import type { FastifyPluginAsync } from "fastify";
import { getSessionUser } from "../auth/auth.service.js";
import { prisma } from "../../plugins/database.js";
import Stripe from "stripe";

const mentorshipRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (_request, reply) => {
    const offerings = await prisma.mentorOffering.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        mentor: {
          select: {
            id: true,
            username: true,
            displayName: true,
            researcherProfile: {
              select: {
                headline: true,
                profileImageUrl: true,
                isVerified: true,
                country: true,
              },
            },
          },
        },
      },
    });
    return reply.send({ offerings });
  });

  app.post<{
    Body: {
      expertise: string;
      description: string;
      serviceType?: "MENTORSHIP" | "TUTORING" | "TEACHING" | "CONSULTING" | "RESEARCH_ADVICE";
      priceMinor?: number;
      currency?: string;
      durationMinutes?: number;
    };
  }>(
    "/offerings",
    {
      schema: {
        body: {
          type: "object",
          required: ["expertise", "description"],
          additionalProperties: false,
          properties: {
            expertise: { type: "string", minLength: 2, maxLength: 150 },
            description: { type: "string", minLength: 10, maxLength: 3000 },
            serviceType: { type: "string", enum: ["MENTORSHIP", "TUTORING", "TEACHING", "CONSULTING", "RESEARCH_ADVICE"] },
            priceMinor: { type: "integer", minimum: 0, maximum: 100000000 },
            currency: { type: "string", minLength: 3, maxLength: 3 },
            durationMinutes: { type: "integer", minimum: 15, maximum: 480 },
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

      const offering = await prisma.mentorOffering.create({
        data: {
          mentorId: user.id,
          expertise: request.body.expertise.trim(),
          description: request.body.description.trim(),
          serviceType: request.body.serviceType ?? "MENTORSHIP",
          priceMinor: request.body.priceMinor ?? 0,
          currency: (request.body.currency ?? "USD").toUpperCase(),
          durationMinutes: request.body.durationMinutes ?? 60,
        },
      });
      return reply.code(201).send({ offering });
    },
  );

  app.post<{ Params: { offeringId: string }; Body: { message: string } }>(
    "/offerings/:offeringId/request",
    {
      schema: {
        params: {
          type: "object",
          required: ["offeringId"],
          additionalProperties: false,
          properties: { offeringId: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["message"],
          additionalProperties: false,
          properties: { message: { type: "string", minLength: 10, maxLength: 3000 } },
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

      const offering = await prisma.mentorOffering.findFirst({
        where: { id: request.params.offeringId, isActive: true },
        select: { id: true, mentorId: true },
      });
      if (!offering) return reply.code(404).send({ error: "Mentorship offering not found" });
      if (offering.mentorId === user.id) {
        return reply.code(400).send({ error: "You cannot request your own mentorship" });
      }

      const existing = await prisma.mentorshipRequest.findFirst({
        where: {
          offeringId: offering.id,
          requesterId: user.id,
          status: "PENDING",
        },
      });
      if (existing) return reply.code(409).send({ error: "You already have a pending request" });

      const mentorshipRequest = await prisma.mentorshipRequest.create({
        data: {
          offeringId: offering.id,
          requesterId: user.id,
          mentorId: offering.mentorId,
          message: request.body.message.trim(),
        },
      });
      return reply.code(201).send({ request: mentorshipRequest });
    },
  );

  app.post("/stripe/onboarding", async (request, reply) => {
    const token = request.cookies.citeface_session;
    if (!token) return reply.code(401).send({ error: "Authentication required" });
    const user = await getSessionUser(token);
    if (!user) {
      reply.clearCookie("citeface_session", { path: "/" });
      return reply.code(401).send({ error: "Your session is invalid or has expired" });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webAppUrl = process.env.WEB_APP_URL;
    if (!secretKey || !webAppUrl) {
      return reply.code(503).send({ error: "Stripe payouts are not configured." });
    }

    const stripe = new Stripe(secretKey);
    let profile = await prisma.researcherProfile.findUnique({ where: { userId: user.id } });
    let accountId = profile?.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        metadata: { citefaceUserId: user.id },
      });
      accountId = account.id;
      profile = await prisma.researcherProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, stripeAccountId: accountId },
        update: { stripeAccountId: accountId },
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${webAppUrl}/mentorship?stripe=refresh`,
      return_url: `${webAppUrl}/mentorship?stripe=complete`,
      type: "account_onboarding",
    });

    return reply.send({ url: accountLink.url });
  });

  app.post<{ Params: { requestId: string } }>(
    "/requests/:requestId/checkout",
    {
      schema: {
        params: {
          type: "object",
          required: ["requestId"],
          additionalProperties: false,
          properties: { requestId: { type: "string", format: "uuid" } },
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

      const mentorshipRequest = await prisma.mentorshipRequest.findUnique({
        where: { id: request.params.requestId },
        include: { offering: true, mentor: { include: { researcherProfile: true } } },
      });
      if (!mentorshipRequest) return reply.code(404).send({ error: "Mentorship request not found" });
      if (mentorshipRequest.requesterId !== user.id) {
        return reply.code(403).send({ error: "Only the requester can pay for this session" });
      }
      if (mentorshipRequest.status !== "ACCEPTED") {
        return reply.code(409).send({ error: "The mentor must accept this request before checkout" });
      }
      if (mentorshipRequest.offering.priceMinor <= 0) {
        return reply.code(400).send({ error: "This offering does not require payment" });
      }

      const secretKey = process.env.STRIPE_SECRET_KEY;
      const webAppUrl = process.env.WEB_APP_URL;
      const accountId = mentorshipRequest.mentor.researcherProfile?.stripeAccountId;
      if (!secretKey || !webAppUrl || !accountId) {
        return reply.code(503).send({ error: "Mentor payouts are not configured." });
      }

      const stripe = new Stripe(secretKey);
      const checkout = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: `${webAppUrl}/mentorship?payment=success`,
        cancel_url: `${webAppUrl}/mentorship?payment=cancelled`,
        client_reference_id: mentorshipRequest.id,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: mentorshipRequest.offering.currency.toLowerCase(),
              unit_amount: mentorshipRequest.offering.priceMinor,
              product_data: {
                name: `${mentorshipRequest.offering.expertise} — expert session`,
                description: `${mentorshipRequest.offering.durationMinutes}-minute paid session`,
              },
            },
          },
        ],
        payment_intent_data: {
          transfer_data: { destination: accountId },
        },
        metadata: {
          citefaceMentorshipRequestId: mentorshipRequest.id,
          citefaceMentorId: mentorshipRequest.mentorId,
          citefaceRequesterId: mentorshipRequest.requesterId,
        },
      });

      await prisma.mentorshipRequest.update({
        where: { id: mentorshipRequest.id },
        data: {
          paymentStatus: "CHECKOUT_CREATED",
          stripeCheckoutSessionId: checkout.id,
        },
      });

      return reply.send({ url: checkout.url });
    },
  );

  app.get("/requests", async (request, reply) => {
    const token = request.cookies.citeface_session;
    if (!token) return reply.code(401).send({ error: "Authentication required" });
    const user = await getSessionUser(token);
    if (!user) {
      reply.clearCookie("citeface_session", { path: "/" });
      return reply.code(401).send({ error: "Your session is invalid or has expired" });
    }

    const [sent, received] = await Promise.all([
      prisma.mentorshipRequest.findMany({
        where: { requesterId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          mentor: { select: { id: true, username: true, displayName: true } },
          offering: { select: { id: true, expertise: true } },
        },
      }),
      prisma.mentorshipRequest.findMany({
        where: { mentorId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          requester: { select: { id: true, username: true, displayName: true } },
          offering: { select: { id: true, expertise: true } },
        },
      }),
    ]);
    return reply.send({ sent, received });
  });

  app.patch<{ Params: { requestId: string }; Body: { status: "ACCEPTED" | "DECLINED" | "CLOSED" } }>(
    "/requests/:requestId",
    {
      schema: {
        params: {
          type: "object",
          required: ["requestId"],
          additionalProperties: false,
          properties: { requestId: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["status"],
          additionalProperties: false,
          properties: { status: { type: "string", enum: ["ACCEPTED", "DECLINED", "CLOSED"] } },
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

      const mentorshipRequest = await prisma.mentorshipRequest.findUnique({
        where: { id: request.params.requestId },
      });
      if (!mentorshipRequest) return reply.code(404).send({ error: "Mentorship request not found" });
      const canUpdate =
        mentorshipRequest.mentorId === user.id ||
        (mentorshipRequest.requesterId === user.id && request.body.status === "CLOSED");
      if (!canUpdate) return reply.code(403).send({ error: "You cannot update this request" });

      const updated = await prisma.mentorshipRequest.update({
        where: { id: mentorshipRequest.id },
        data: { status: request.body.status },
      });
      return reply.send({ request: updated });
    },
  );
};

export default mentorshipRoutes;
