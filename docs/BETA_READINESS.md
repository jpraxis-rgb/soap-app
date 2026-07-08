# Beta Readiness Review — Estuda Tudo

Pre-launch review of the API (`apps/api`), mobile/web client (`apps/mobile`), and
shared package. Findings below were verified against the running system; two of
the criticals were confirmed by live exploit before fixing. All items marked
**Fixed** are in this branch; typecheck (shared/api/mobile), lint, and the 99-test
API suite all pass.

## Critical (launch blockers) — all fixed

| # | Issue | Fix |
|---|-------|-----|
| C1 | Refresh/access tokens fell back to a hardcoded secret public in source → account-takeover forgery | `JWT_SECRET` & `JWT_REFRESH_SECRET` now required (throws on boot in production); algorithm pinned to HS256; both documented in `.env.example` |
| C2 | `POST /auth/apple` minted a valid session for any string (confirmed live) | Endpoint returns `501`; `appleAuth` throws `NotImplementedError` until real Apple JWKS verification exists |
| C3 | Any user could self-upgrade to a paid tier without paying (confirmed live) | Client-driven `POST /subscriptions/create` disabled (`501`); everyone stays `free` until real billing + verified webhooks. Decision: paywall off for beta |
| C4 | Dev-auth bypass triggered by weak/absent `JWT_SECRET`; Dockerfile never set production | Dev-auth now gated behind explicit `ENABLE_DEV_AUTH=true` (never in prod); `Dockerfile` sets `NODE_ENV=production` |
| C5 | On web, finishing a study session trapped the user (Alert callback never fires on react-native-web) | `navigation.goBack()` now runs unconditionally after save; new cross-platform `showAlert`/`showConfirm` helper used app-wide |

## High — all fixed

| # | Issue | Fix |
|---|-------|-----|
| H1 | Google access-token path didn't verify audience (replay → takeover) | Verifies via `tokeninfo` and asserts `aud === GOOGLE_CLIENT_ID` before trusting the email |
| H2 | Subscription tier names disagreed across 3 layers | `TIER_HIERARCHY` derives from the shared `SubscriptionTier` enum (`free·registro·microlearning·mentor`) |
| H3 | Unmetered Gemini endpoints + IDOR on edital seeding | Strict per-user `aiLimiter` (15/hr) on all generation endpoints; ownership check on `seed-for-edital` |
| H4 | SSRF via edital `source_url` | `assertPublicHttpUrl` blocks non-http(s), loopback, link-local, private, CGNAT and unique-local ranges (v4+v6) before fetch; redirects disabled |
| H5 | SRS resurfaced already-advanced cards; tested SM-2 was dead code | Due-ness computed from the latest review per card (`DISTINCT ON`) |
| H6 | app.json shipped no icon/splash; stale `com.soap.app` ids | Added `icon`/`splash`/adaptive `foregroundImage`/favicon (real brand PNGs); ids → `com.estudatudo.app`, scheme → `estudatudo` (Google `iosUrlScheme` unaffected) |
| H7 | Expired session left user logged-in with nothing working | Definitive 401 now clears tokens and logs out via an `AuthContext` handler (no logout loop) |
| H8 | Literal `í` mojibake on edital review screen | Renders `Conhecimentos Específicos` correctly |

## Medium — all fixed

- **M1** Global error handler added (generic message + request id, no stack leakage; multer → 413/415); JSON 404 for unknown API routes.
- **M2** CORS honors the `CORS_ORIGINS` allowlist when set (no longer dead code).
- **M3** Quiz-results IDOR closed — `getQuizResults` scoped to the requesting user.
- **M4** Multi-cargo editais now flatten the selected cargo's disciplinas into rows (schedule generation no longer fails with "No disciplinas found").
- **M5** Streaks and the weekly histogram bucket in `America/Sao_Paulo` (UTC−3) instead of UTC.
- **M6** New migration `0006_*` creates the three declared-but-missing indexes.
- **M7** Schedule algorithm: all-zero weights → `[]`; low-weight disciplinas carry sub-minimum shares across days instead of being dropped; completed sessions can no longer increase remaining minutes (monotonic).
- **M8** Mitigated — AI generation is ownership-checked and rate-limited (full curation-before-publish recommended as follow-up).
- **M9** Non-functional controls (subscription, settings, profile) now show honest, web-visible "em breve" feedback instead of silent no-ops.
- **M10** _Deferred_ — schedule regeneration is still delete-then-insert without a transaction. Low blast radius; wrap in `db.transaction` in a follow-up.

## Low

- **Fixed:** password minimum raised to 8 (L4); pdf-parse test/impl mismatch fixed so the suite exercises real code (L5); ESLint flat config added and wired so `npm run lint` runs (L8); time-aware home greeting (L9); silent MOCK-content fallbacks replaced with empty states (L7); edital/disciplina metadata IDOR ownership-checked on `content/for-edital` (L10, partial).
- **Deferred (backlog):** registration email enumeration via 409 (L1 — needs email-verification flow to fix properly); access-token revocation/blacklist (L3); consolidating the duplicate tested-but-unused scoring/SM-2 modules (L6); remaining metadata endpoints (L10).

## Verified solid (unchanged)

Parameterized queries (no SQL injection), Google **ID-token** audience check, bcrypt cost 12 + constant-time compare, ownership checks on schedule/session/edital mutations, upload limits (5 MB, PDF-only, memory storage), helmet, single-flighted 401 refresh, clean rebrand (no leftover "SOAP" in user-visible strings), seed content matching templates, and the end-to-end core flow (register → import edital → generate schedule → track progress).

## Ops checklist before deploying

1. Set strong, distinct `JWT_SECRET` and `JWT_REFRESH_SECRET` (e.g. `openssl rand -hex 32`).
2. Set `NODE_ENV=production` (the Dockerfile now does; confirm your platform doesn't override it).
3. Set `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `FRONTEND_URL` (deployed web origin), and `CORS_ORIGINS`.
4. Leave `ENABLE_DEV_AUTH` unset/false.
5. Run `npm run db:migrate` to apply the new index migration.
