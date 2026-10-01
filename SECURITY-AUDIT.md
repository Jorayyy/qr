# Security Audit & Hardening Report — University QR Visitor Management System

Date: 2026-10-02
Target: `https://qr-pink-beta.vercel.app/` (repo: Jorayyy/qr)
Method: full code review + fixes implemented in-repo, verified with
`prisma validate`, `tsc --noEmit`, `eslint`, `vitest` (53 tests) and `next build`.

---

## 1. Executive summary

The original build had **critical, exploitable flaws**: no server-side
authentication on any page or mutation, an unauthenticated PII API, no rate
limiting, a hardcoded JWT fallback secret, weak QR generation, and a DOM-XSS
print helper. All critical and high findings are now **fixed in code**, with
defense-in-depth (sessions, RBAC, rate limits, audit, headers, tests, CI) added.
The app now builds clean with Next.js 16.3.8 (upgraded from 16.3.2 to patch
three RCE advisories).

## 2. Findings → fixes

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| 1 | **Critical** | All Server Actions (register visitor, check-in/out, delete visitor, department CRUD) were unauthenticated — `requireRole` existed but was never called | Fixed: `requirePermission()` guard in every action (`src/lib/actions/*`), enforced against `src/lib/rbac.ts` |
| 2 | **Critical** | `/api/visits/lookup` returned full PII (email, phone, ID number, company) to anonymous callers | Fixed: session → allow-listed staff projection; anonymous → minimal kiosk projection (first name, dept, status, purpose) |
| 3 | **Critical** | `/api/visits/checkin` unauthenticated with IDOR (any `visitId` accepted) | Fixed: QR-secret possession model or authenticated `visit:transition` permission; origin check; state-machine guard |
| 4 | **Critical** | Hardcoded JWT secret fallback `"vms-dev-secret-change-in-production"` | Fixed: `src/lib/env.ts` `requiredSecret()` fails fast in production when `SESSION_SECRET` < 32 chars; opaque DB-backed sessions replaced JWTs entirely |
| 5 | **Critical** | Next.js 16.3.2 RCE advisories (GHSA-p293-qw3h-jr36, GHSA-2xp9-vwfh-vxw4, GHSA-vcvr-r3jv-pc5j) | Fixed: upgraded to `next@16.3.8` + `eslint-config-next@16.3.8` |
| 6 | **High** | No authentication on staff pages — `/scanner`, `/visitors`, `/departments` fully public | Fixed: real `requireSession()`/`requirePermission()` in `(app)/layout.tsx` and every page; `src/proxy.ts` adds optimistic cookie check (documented as UX-only layer) |
| 7 | **High** | Account enumeration (different errors for unknown user vs bad password vs deactivated) | Fixed: generic "Invalid email or password" everywhere; deactivated notice only after the password verifies; timing equalized with a dummy Argon2 verify |
| 8 | **High** | No rate limiting anywhere | Fixed: Postgres fixed-window counters (`rate_limits` table) + per-instance memory short-circuit on login, MFA, lookup, check-in, register, search, department reads, admin actions; `RATE_*` env tunables |
| 9 | **High** | No account lockout | Fixed: escalating lockout every 5 failures (1/5/15/30 min), no attempt-counting while locked (anti-extension), admin unlock tool |
| 10 | **High** | Weak QR codes (`Date.now()` + 4 random bytes, ~32 bits) | Fixed: 128-bit `randomBytes(16)` + `qrExpiresAt` + `qrRevokedAt`; QR value never written to audit logs |
| 11 | **High** | DOM XSS in print helper (`win.document.write` with unescaped visitor name) | Fixed: safe DOM construction with `textContent` (`register-form.tsx`) |
| 12 | **High** | No audit trail | Fixed: append-only `audit_logs` (auth events, privileged actions, QR scans, PII views) with sanitized metadata (primitives only, strings ≤ 200 chars) |
| 13 | **High** | No security headers | Fixed: CSP (`frame-ancestors 'none'`, `object-src 'none'`, `form-action 'self'`), HSTS preload, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy (camera = self), COOP/CORP, `Cache-Control: no-store` on APIs, `poweredByHeader: false` |
| 14 | **High** | No MFA | Fixed: TOTP enrollment (`/account/security`), AES-256-GCM encryption of secrets at rest, single-use recovery codes, login challenge flow, admin MFA reset |
| 15 | **Medium** | No password policy / breached-password check | Fixed: ≥ 12 chars, common-password denylist, variety rule, email-substring rule, HIBP range API (k-anonymity, 3 s timeout, fail-open) |
| 16 | **Medium** | Weak password hashing (bcrypt cost 10 only) | Fixed: Argon2id (m=19456, t=2, p=1); legacy bcrypt hashes verified and transparently upgraded on next login |
| 17 | **Medium** | Visit state machine bypass (check-in after checkout, cancelled visits, etc.) | Fixed: central `transitionVisit()` with explicit allowed transitions in every mutating action |
| 18 | **Medium** | Open redirect via post-login target | Fixed: `safeCallbackUrl()` (same-site paths only), used in login + MFA flows |
| 19 | **Medium** | Server Actions without Origin check notes / route handlers unauthenticated | Fixed: mutations check origin in route handlers; Server Actions rely on Next's built-in Origin/CSRF check plus permission guards |
| 20 | **Medium** | Hardcoded seed credentials in `prisma/seed.ts` | Fixed: env-provided or randomly generated one-time passwords printed once; users flagged `mustChangePassword` |
| 21 | **Medium** | Kiosk shows previous visitor's data / no auto-reset | Fixed: `KioskIdleReset` returns the terminal to home after 60 s idle |
| 22 | **Medium** | No session management visibility | Fixed: `/security` admin page — users (create/role/activate/lock/unlock/reset pwd/reset MFA), active sessions (revoke), filterable paginated audit log |
| 23 | **Medium** | No forced password-change flow | Fixed: `/account/password` + layout redirect that holds `mustChangePassword` users until they comply; password change revokes all other sessions |
| 24 | **Low** | No error/404 pages (framework defaults leak less, but inconsistent) | Fixed: custom `not-found.tsx` / `error.tsx`, no PII in output |
| 25 | **Low** | No retention policy for security data | Fixed: `npm run purge` (`scripts/purge-retention.ts`) with `AUDIT_RETENTION_DAYS` / `SESSION_RETENTION_DAYS` |
| 26 | **Low** | No tests / CI | Fixed: 53 vitest unit tests (validation, RBAC matrix, password, MFA, env, audit sanitization), GitHub Actions CI, Dependabot |

### Bugs found and fixed during hardening

- Recovery-code consumption stripped `-` from codes, rejecting ~10 % of valid
  generated codes (`src/lib/mfa.ts`).
- `loginSchema` email field had no format validation (accepted `not-an-email`).
- Session `lastSeenAt` write throttling bug in the session engine.
- `activateMfaSession` fetched `cookies()` without using it (dead code).

## 3. Verification

| Check | Result |
|-------|--------|
| `npx prisma validate` | ✅ schema valid |
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors (6 warnings: `no-img-element` on local logos/QR images, 2 intentional camera-effect dep arrays) |
| `npm test` | ✅ 53/53 passing |
| `npm run build` | ✅ Next 16.3.8, all 20 routes + proxy |
| `npm audit` | 3 high remaining — `deepmerge-ts` via `@prisma/config` via `prisma` CLI (**build-time only**, not shipped; fix would downgrade Prisma — accepted, see §5) |

## 4. Production checklist

### One-time deployment

- [ ] Set `DATABASE_URL` (pooled, `sslmode=require`) in Vercel → Project → Settings → Environment Variables
- [ ] Set `SESSION_SECRET` = `openssl rand -hex 32` (≥ 32 chars) in Vercel
- [ ] Run `npx prisma migrate deploy` against the production database (adds `sessions`, `audit_logs`, `rate_limits` + user/session columns)
- [ ] Run `npm run seed` once (or `SEED_ADMIN_PASSWORD=... SEED_SECURITY_PASSWORD=... npm run seed`) and **store the one-time passwords securely**
- [ ] Deploy from a branch/commit that includes `next@16.3.8` (verify build log shows `Next.js 16.3.8`)
- [ ] Confirm the seeded admin signs in, is forced to change the password, then deletes/rotates anything printed

### Immediately after go-live

- [ ] Admin: enable MFA for all admin/security accounts (`Account → Two-factor auth`)
- [ ] Admin: create real staff accounts via `/security?tab=users`, deactivate the seeded `security@` account if unused
- [ ] Admin: verify `/security?tab=audit` records a `LOGIN_SUCCESS` entry
- [ ] Smoke test: kiosk register → scan → check-in → check-out → cancel path
- [ ] Smoke test: visit `/dashboard` logged out → must redirect to `/login`
- [ ] Smoke test: `curl` the lookup API anonymously → must return only the minimal projection
- [ ] Verify security headers: `curl -I https://qr-pink-beta.vercel.app/login`

### Recurring

- [ ] Schedule `npm run purge` (Vercel Cron or external cron; requires DB access) — weekly is fine
- [ ] Subscribe to Dependabot PRs; run CI before merging
- [ ] Rotate `SESSION_SECRET` periodically (invalidates MFA secrets — coordinate: users must re-enroll, or keep stable and rely on rotation of individual accounts)
- [ ] Review `/security?tab=audit` monthly; watch `LOGIN_FAILED` / `LOGIN_LOCKED` clusters
- [ ] DB backups (Vercel/Postgres provider) — audit logs are append-only evidence
- [ ] `npm audit` periodically; the 3 remaining highs are Prisma-CLI-only and drop away when Prisma ships a patched `@prisma/config`

### Vercel/ops notes

- [ ] Node 22 runtime (matches CI)
- [ ] Do **not** set `NODE_ENV` manually
- [ ] Local dev without a DB: app degrades gracefully at request time only; `.env` is gitignored and uses dummy values

## 5. Accepted risks / limitations

1. **Prisma CLI advisory** (`deepmerge-ts` in `@prisma/config`): development/build tooling only; not present in the server bundle. Fix requires a Prisma downgrade — deferred until upstream patches.
2. **CSP uses `'unsafe-inline'` for scripts**: required by Next.js inline bootstrap scripts without per-request nonce support in `headers()`; React escaping + no `dangerouslySetInnerHTML` + upgrade-insecure-requests keep the practical risk low. A per-request nonce via `proxy.ts` is a possible future upgrade.
3. **Rate limits are per-instance memory + shared Postgres counters**: correct but eventually consistent across serverless instances (sub-second windows).
4. **HIBP breached-password check fails open** on network errors (logged as `HIBP_UNAVAILABLE`) to avoid locking users out when the service is down.
5. **No email provider** (per decision): password resets and MFA recovery are admin-driven or self-service with an existing session only.
6. **Single `SESSION_SECRET`**: rotating it invalidates encrypted MFA secrets; treat it like a database credential.
7. **Kiosk first-name-only projection**: bystanders at the kiosk see the visitor's first name by design; last name is not returned to anonymous callers.
