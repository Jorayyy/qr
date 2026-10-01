This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Setup

```bash
npm install
cp .env.example .env        # then fill in DATABASE_URL and SESSION_SECRET
npx prisma migrate deploy   # apply migrations
npm run seed                # creates initial admin/security users
npm run dev
```

Seeding prints one-time passwords to the terminal when `SEED_ADMIN_PASSWORD` /
`SEED_SECURITY_PASSWORD` are unset. Users are forced to change their password at
first sign-in.

## Environment

See `.env.example` for every variable. The two required ones:

- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — random string ≥ 32 chars (`openssl rand -hex 32`); used to
  encrypt MFA secrets. The app fails fast in production when it is missing.

## Security model (summary)

- **Sessions**: opaque 32-byte cookie token (only its SHA-256 hash is stored),
  `HttpOnly` + `Secure` + `SameSite=Lax`, idle 120 min / absolute 16 h
  (`SESSION_IDLE_MINUTES`, `SESSION_ABSOLUTE_HOURS`). Password changes and admin
  resets revoke every session.
- **Authorization**: server-side permission matrix in `src/lib/rbac.ts`
  (ADMIN / STAFF / SECURITY / RECEPTIONIST). Every Server Action and API route
  enforces its own permission — the UI is never the authority.
- **Passwords**: Argon2id (19 MiB, t=2, p=1) with seamless upgrade from legacy
  bcrypt hashes on next login; 12-char minimum, common/breached password checks
  (Have I Been Pwned k-anonymity, fail-open offline), timing-equalized login,
  escalating lockout (5 fails → 1/5/15/30 min), generic errors (no account
  enumeration).
- **MFA**: TOTP (otpauth) with AES-256-GCM-encrypted secrets and single-use
  recovery codes; optional per user, enforced only by policy you choose.
- **Rate limiting**: Postgres fixed-window counters (`rate_limits` table) with a
  per-instance in-memory short-circuit; tunable via `RATE_*` env vars.
- **Audit**: append-only `audit_logs` for auth events, privileged actions,
  QR scans and PII access; metadata sanitized (primitives only, ≤ 200 chars).
- **Headers**: CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy,
  Permissions-Policy (camera = self for the scanner) via `next.config.ts`.
- **QR codes**: 128-bit random, optional expiry/revocation, single-use state
  machine for visit transitions.
- **Kiosk**: public register/lookup/check-in endpoints are validated, rate
  limited and audited; lookup returns a minimal projection (first name only);
  the terminal auto-returns home after 60 s of inactivity.

## Operations

```bash
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test            # vitest unit tests
npm run build       # production build
npm run purge       # retention cleanup (audit logs / old sessions) — cron this
npx prisma migrate deploy
```

CI runs lint + typecheck + tests + build on every push/PR
(`.github/workflows/ci.yml`); Dependabot opens weekly update PRs.
