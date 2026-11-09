import { createHash, randomBytes } from "node:crypto";
import { Resend } from "resend";
import { prisma } from "../../plugins/database.js";
import { hashPassword } from "./password.js";

const RESET_TOKEN_EXPIRY_MS = 30 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Request a password-reset email.
export async function requestPasswordReset(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      status: true,
      deletedAt: true,
    },
  });

  // Do not disclose whether an account exists.
  if (
    !user ||
    !user.passwordHash ||
    user.deletedAt ||
    user.status !== "ACTIVE"
  ) {
    return;
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + RESET_TOKEN_EXPIRY_MS);

  // Invalidate previous unused reset tokens.
  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: now,
      },
    }),

    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const webAppUrl = process.env.WEB_APP_URL;

  if (!apiKey || !fromEmail || !webAppUrl) {
    throw new Error("Password recovery email configuration is incomplete.");
  }

  const resend = new Resend(apiKey);

  const resetUrl = new URL("/reset-password", webAppUrl);
  resetUrl.searchParams.set("token", token);

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: user.email,
    subject: "Reset your Citeface password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto;">
        <h2>Password reset request</h2>
        <p>We received a request to reset your Citeface password.</p>
        <p>Click the button below to choose a new password.</p>
        <p>
          <a href="${resetUrl.toString()}"
             style="background:#2563eb;color:white;padding:12px 20px;
                    text-decoration:none;border-radius:6px;">
            Reset my password
          </a>
        </p>
        <p>This link expires in 30 minutes and can only be used once.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
    text: `Reset your Citeface password using this link: ${resetUrl.toString()}. This link expires in 30 minutes.`,
  });

  if (error) {
    // Never log the reset token or complete reset URL.
    throw new Error("Password reset email delivery failed.");
  }
}

// Validate a reset token and change the password.
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<boolean> {
  const tokenHash = hashToken(token);

  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  const now = new Date();

  if (
    !resetRecord ||
    resetRecord.usedAt ||
    resetRecord.expiresAt <= now ||
    resetRecord.user.deletedAt ||
    resetRecord.user.status !== "ACTIVE"
  ) {
    return false;
  }

  const passwordHash = await hashPassword(newPassword);

  // Claim the token atomically so it cannot be reused.
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.passwordResetToken.updateMany({
      where: {
        id: resetRecord.id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        usedAt: now,
      },
    });

    if (claimed.count !== 1) {
      return false;
    }

    await tx.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    });

    // Invalidate every other outstanding reset token.
    await tx.passwordResetToken.updateMany({
      where: {
        userId: resetRecord.userId,
        id: { not: resetRecord.id },
        usedAt: null,
      },
      data: { usedAt: now },
    });

    // Revoke every existing session.
    await tx.session.updateMany({
      where: {
        userId: resetRecord.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
      },
    });

    return true;
  });
}