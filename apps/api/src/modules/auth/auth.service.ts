import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../../plugins/database.js";
import { hashPassword, verifyPassword } from "./password.js";

// Generate a secure random session token.
function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

// Hash the token before storing it in the database.
function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Register a new user.
export async function registerUser(data: {
  email: string;
  password: string;
  displayName: string;
  username?: string;
}) {
  const email = data.email.trim().toLowerCase();
  const baseHandle = data.displayName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 18);
  const explicitHandle = data.username?.trim().toLowerCase();
  const username =
    explicitHandle ||
    `${baseHandle || "researcher"}${randomBytes(4).toString("hex")}`;

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      displayName: data.displayName.trim(),
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      createdAt: true,
    },
  });

  return user;
}

// Verify a user's login credentials.
export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: {
      email: email.trim().toLowerCase(),
    },
    include: {
      researcherProfile: {
        select: { profileImageUrl: true },
      },
    },
  });

  if (!user || !user.passwordHash || user.deletedAt) {
    return null;
  }

  const passwordIsValid = await verifyPassword(user.passwordHash, password);

  if (!passwordIsValid) {
    return null;
  }

  if (user.status !== "ACTIVE") {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    profileImageUrl: user.researcherProfile?.profileImageUrl ?? null,
  };
}

// Create a new session for a user.
export async function createSession(userId: string) {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    token,
    expiresAt,
  };
}

// Find the user associated with a valid session token.
export async function getSessionUser(token: string) {
  const tokenHash = hashSessionToken(token);

  const session = await prisma.session.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: {
        include: {
          researcherProfile: {
            select: { profileImageUrl: true },
          },
        },
      },
    },
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    session.user.deletedAt ||
    session.user.status !== "ACTIVE"
  ) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    username: session.user.username,
    displayName: session.user.displayName,
    profileImageUrl: session.user.researcherProfile?.profileImageUrl ?? null,
  };
}

// Revoke a session when a user logs out.
export async function revokeSession(token: string) {
  const tokenHash = hashSessionToken(token);

  await prisma.session.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}