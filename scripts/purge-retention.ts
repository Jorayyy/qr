/**
 * Retention cleanup for security data. Run periodically (cron / Vercel Cron):
 *   npm run purge
 *
 * - audit_logs older than AUDIT_RETENTION_DAYS (default 365)
 * - sessions revoked/expired longer than SESSION_RETENTION_DAYS (default 30)
 * - rate_limits rows older than 24h (their windows are long gone)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function daysFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
}

async function main() {
  const auditDays = daysFromEnv("AUDIT_RETENTION_DAYS", 365);
  const sessionDays = daysFromEnv("SESSION_RETENTION_DAYS", 30);
  const now = new Date();

  const auditCutoff = new Date(now.getTime() - auditDays * 86_400_000);
  const sessionCutoff = new Date(now.getTime() - sessionDays * 86_400_000);
  const rateCutoff = new Date(now.getTime() - 86_400_000);

  const audit = await prisma.auditLog.deleteMany({ where: { createdAt: { lt: auditCutoff } } });
  const sessions = await prisma.session.deleteMany({
    where: {
      OR: [
        { revokedAt: { not: null, lt: sessionCutoff } },
        { absoluteExpiresAt: { lt: sessionCutoff } },
      ],
    },
  });
  const rate = await prisma.rateLimit.deleteMany({ where: { windowStart: { lt: rateCutoff } } });

  console.log(
    JSON.stringify({
      level: "info",
      event: "RETENTION_PURGE",
      auditDeleted: audit.count,
      sessionsDeleted: sessions.count,
      rateLimitsDeleted: rate.count,
      auditDays,
      sessionDays,
    })
  );
}

main()
  .catch((error) => {
    console.error(JSON.stringify({ level: "error", event: "RETENTION_PURGE_ERROR", error: String(error) }));
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
