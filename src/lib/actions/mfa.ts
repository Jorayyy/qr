"use server";

import { db } from "@/lib/db";
import { getRequestContext, getSession, type SessionUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { LIMITS, WINDOWS, rateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/password";
import {
  decryptSecret,
  encryptSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  totpUri,
  verifyTotp,
} from "@/lib/mfa";
import { formString, mfaCodeSchema } from "@/lib/validation";

export type MfaSetupState = {
  error?: string;
  uri?: string;
  secret?: string;
} | null;

export type MfaVerifyState = {
  error?: string;
  recoveryCodes?: string[];
} | null;

export type MfaDisableState = { error?: string; success?: boolean } | null;

async function requireUser(): Promise<SessionUser | null> {
  return getSession();
}

/** Starts (or resumes) TOTP enrollment for the signed-in user. */
export async function startMfaEnrollmentAction(): Promise<MfaSetupState> {
  const ctx = await getRequestContext();
  const user = await requireUser();
  if (!user) return { error: "Not authorized." };
  if (user.mustChangePassword) return { error: "Change your password first." };

  const limit = await rateLimit(`mfa:setup:${user.userId}`, LIMITS.mfaPerSession(), WINDOWS.medium);
  if (!limit.ok) return { error: "Too many attempts. Please wait and try again." };

  try {
    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
      select: { id: true, email: true, mfaEnabled: true, mfaSecret: true },
    });
    if (!dbUser) return { error: "Not authorized." };
    if (dbUser.mfaEnabled) return { error: "Multi-factor authentication is already enabled." };

    let secret: string;
    if (dbUser.mfaSecret) {
      secret = decryptSecret(dbUser.mfaSecret);
    } else {
      secret = generateTotpSecret();
      await db.user.update({
        where: { id: dbUser.id },
        data: { mfaSecret: encryptSecret(secret) },
      });
    }

    return { uri: totpUri(secret, dbUser.email), secret };
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "MFA_SETUP_ERROR",
        requestId: ctx.requestId,
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return { error: "Could not start MFA setup. Please try again." };
  }
}

/** Confirms the authenticator app, enables MFA and issues recovery codes. */
export async function verifyMfaEnrollmentAction(
  _prev: MfaVerifyState,
  formData: FormData
): Promise<MfaVerifyState> {
  const ctx = await getRequestContext();
  const user = await requireUser();
  if (!user) return { error: "Not authorized." };

  const limit = await rateLimit(`mfa:enroll:${user.userId}`, LIMITS.mfaPerSession(), WINDOWS.medium);
  if (!limit.ok) return { error: "Too many attempts. Please wait and try again." };

  const parsed = mfaCodeSchema.safeParse({ code: formString(formData, "code") });
  if (!parsed.success) return { error: "Enter the 6-digit code from your authenticator app." };

  try {
    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
      select: { id: true, email: true, mfaEnabled: true, mfaSecret: true },
    });
    if (!dbUser) return { error: "Not authorized." };
    if (dbUser.mfaEnabled) return { error: "Multi-factor authentication is already enabled." };
    if (!dbUser.mfaSecret) return { error: "Start the setup process first." };

    const ok = verifyTotp(decryptSecret(dbUser.mfaSecret), parsed.data.code);
    if (!ok) return { error: "Incorrect code. Check your authenticator app and try again." };

    const recovery = generateRecoveryCodes();
    await db.user.update({
      where: { id: dbUser.id },
      data: {
        mfaEnabled: true,
        mfaEnrolledAt: new Date(),
        mfaRecoveryCodes: recovery.stored,
      },
    });

    await recordAudit({
      actorId: user.userId,
      actorEmail: user.email,
      action: "MFA_ENABLED",
      result: "SUCCESS",
      targetType: "user",
      targetId: user.userId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      requestId: ctx.requestId,
    });

    return { recoveryCodes: recovery.codes };
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "MFA_VERIFY_ENROLL_ERROR",
        requestId: ctx.requestId,
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return { error: "Verification failed. Please try again." };
  }
}

/** Disables MFA — requires the account password (re-authentication). */
export async function disableMfaAction(
  _prev: MfaDisableState,
  formData: FormData
): Promise<MfaDisableState> {
  const ctx = await getRequestContext();
  const user = await requireUser();
  if (!user) return { error: "Not authorized." };

  const limit = await rateLimit(`mfa:disable:${user.userId}`, LIMITS.mfaPerSession(), WINDOWS.medium);
  if (!limit.ok) return { error: "Too many attempts. Please wait and try again." };

  const password = formString(formData, "password");
  if (!password) return { error: "Enter your password to disable MFA." };

  try {
    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
      select: { id: true, email: true, passwordHash: true, mfaEnabled: true },
    });
    if (!dbUser) return { error: "Not authorized." };
    if (!dbUser.mfaEnabled) return { error: "MFA is not enabled." };

    const { valid } = await verifyPassword(dbUser.passwordHash, password);
    if (!valid) {
      await recordAudit({
        actorId: user.userId,
        actorEmail: user.email,
        action: "MFA_DISABLE_FAILED",
        result: "FAILURE",
        targetType: "user",
        targetId: user.userId,
        ip: ctx.ip,
        requestId: ctx.requestId,
        meta: { reason: "bad_password" },
      });
      return { error: "Password is incorrect." };
    }

    await db.user.update({
      where: { id: dbUser.id },
      data: { mfaEnabled: false, mfaSecret: null, mfaRecoveryCodes: null, mfaEnrolledAt: null },
    });

    await recordAudit({
      actorId: user.userId,
      actorEmail: user.email,
      action: "MFA_DISABLED",
      result: "SUCCESS",
      targetType: "user",
      targetId: user.userId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      requestId: ctx.requestId,
    });

    return { success: true };
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "MFA_DISABLE_ERROR",
        requestId: ctx.requestId,
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return { error: "Could not disable MFA. Please try again." };
  }
}

/** Issues a fresh set of recovery codes (requires password; old set invalidated). */
export async function regenerateRecoveryCodesAction(
  _prev: MfaVerifyState,
  formData: FormData
): Promise<MfaVerifyState> {
  const ctx = await getRequestContext();
  const user = await requireUser();
  if (!user) return { error: "Not authorized." };

  const limit = await rateLimit(`mfa:recovery:${user.userId}`, LIMITS.mfaPerSession(), WINDOWS.medium);
  if (!limit.ok) return { error: "Too many attempts. Please wait and try again." };

  const password = formString(formData, "password");
  if (!password) return { error: "Enter your password." };

  try {
    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
      select: { id: true, email: true, passwordHash: true, mfaEnabled: true },
    });
    if (!dbUser) return { error: "Not authorized." };
    if (!dbUser.mfaEnabled) return { error: "MFA is not enabled." };

    const { valid } = await verifyPassword(dbUser.passwordHash, password);
    if (!valid) return { error: "Password is incorrect." };

    const recovery = generateRecoveryCodes();
    await db.user.update({
      where: { id: dbUser.id },
      data: { mfaRecoveryCodes: recovery.stored },
    });

    await recordAudit({
      actorId: user.userId,
      actorEmail: user.email,
      action: "MFA_RECOVERY_REGENERATED",
      result: "SUCCESS",
      targetType: "user",
      targetId: user.userId,
      ip: ctx.ip,
      requestId: ctx.requestId,
    });

    return { recoveryCodes: recovery.codes };
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "MFA_RECOVERY_ERROR",
        requestId: ctx.requestId,
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return { error: "Could not regenerate codes. Please try again." };
  }
}

/** Used by tests and future admin tooling: check whether a user has MFA. */
export async function hasActiveMfa(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true },
  });
  return Boolean(user?.mfaEnabled);
}
