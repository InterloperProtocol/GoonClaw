# Security Best Practices Report

## Executive Summary

The codebase is generally structured cleanly, but there are several meaningful security and operational risks in request-facing paths. The highest-impact issue is an SSRF primitive in the REST device flow, where user-supplied URLs are stored and later fetched by the server runtime. I also found a state-changing `GET` path in the livestream queue, missing brute-force protections on admin authentication, no visible baseline security headers/CSP in app code, and a silent in-memory fallback for critical data when Firestore is unavailable.

## High Severity

### Finding 1

- Rule ID: NEXT-SSRF-001
- Severity: High
- Location: `app/api/devices/route.ts:67-95`, `lib/server/devices.ts:244-320`
- Evidence:
  - `app/api/devices/route.ts:72-95` accepts arbitrary `credentials.endpointUrl` for `rest` devices after only checking that it is non-empty.
  - `lib/server/devices.ts:267`, `lib/server/devices.ts:282`, and `lib/server/devices.ts:305` send server-side requests directly to `this.credentials.endpointUrl!`.
- Impact: Any guest who can create a REST device can make the server probe or post to arbitrary URLs, including internal network targets or cloud metadata endpoints, which is a classic SSRF path.
- Fix: Restrict REST device endpoints to an allowlist of trusted hosts or private integrations, reject private/link-local/loopback IP ranges after DNS resolution, and require explicit admin approval before storing or using new REST endpoints.
- Mitigation: If arbitrary REST targets must remain, isolate the worker runtime behind strict egress rules so it cannot reach internal control planes, metadata services, or private subnets.
- False positive notes: If outbound network egress is already tightly filtered at the VM/VPC layer, the exploitability is reduced, but that protection is not visible in app code and should be verified separately.

### Finding 2

- Rule ID: NEXT-METHOD-001
- Severity: High
- Location: `app/api/livestream/status/route.ts:7-12`, `lib/server/livestream.ts:217-276`, `lib/server/livestream.ts:298-300`
- Evidence:
  - `app/api/livestream/status/route.ts:7-12` exposes a `GET` endpoint.
  - `lib/server/livestream.ts:298-300` calls `syncLivestreamQueue()` inside `getLivestreamState()`.
  - `lib/server/livestream.ts:244-276` can `dispatchSessionStart(...)`, update queue state, and fail requests during that sync.
- Impact: A harmless-looking `GET` can mutate queue state and start or stop real sessions. Crawlers, aggressive polling, browser prefetching, or accidental third-party hits can trigger side effects that should require an explicit mutation path.
- Fix: Move queue advancement into a dedicated authenticated/internal scheduler or explicit mutation endpoint, and keep `GET /api/livestream/status` read-only.
- Mitigation: Short term, gate queue sync behind a server-only cron/worker path and make the public status endpoint serve cached queue state only.
- False positive notes: If only trusted internal callers can reach this route in production, the risk drops, but the route is public in app code today.

## Medium Severity

### Finding 3

- Rule ID: NEXT-AUTH-001
- Severity: Medium
- Location: `app/api/internal-admin/auth/login/route.ts:6-35`, `app/api/internal-admin/autonomous/control/route.ts:19-40`
- Evidence:
  - `app/api/internal-admin/auth/login/route.ts:6-35` performs password-based admin login with no visible rate limit, lockout, cooldown, or IP throttling.
  - `app/api/internal-admin/autonomous/control/route.ts:19-40` exposes privileged owner controls once the cookie session exists.
- Impact: The hidden admin path is still reachable server code, and without rate limiting it is exposed to password spraying and brute-force attempts. Successful compromise gives direct pause/liquidate/self-mod/replication control over GoonClaw.
- Fix: Add IP and username-based rate limiting, short lockouts on repeated failures, and ideally a second factor or signed-wallet owner check for the hidden admin surface.
- Mitigation: Put the hidden admin routes behind an IP allowlist, Cloud Armor/WAF policy, or identity-aware proxy until application-level throttling is added.
- False positive notes: If infrastructure already rate-limits these routes, that is not visible in the repo and should be verified in deployment config.

### Finding 4

- Rule ID: NEXT-HEADERS-001
- Severity: Medium
- Location: `next.config.ts:4-8`
- Evidence:
  - The app config only sets `outputFileTracingIncludes` and does not define app-level security headers or a CSP.
- Impact: There is no visible defense-in-depth layer for XSS, clickjacking, or content-type confusion in app code. Even if no active XSS sink is obvious right now, the lack of a CSP and baseline headers makes future bugs more damaging.
- Fix: Add baseline security headers, especially a CSP, `X-Content-Type-Options: nosniff`, and clickjacking protection via `frame-ancestors`/`X-Frame-Options` where compatible with product requirements.
- Mitigation: If headers are already injected at the CDN/proxy layer, document that in the repo and test it in production.
- False positive notes: This finding is app-code scoped. Infra headers may exist, but they are not represented here.

### Finding 5

- Rule ID: NEXT-DATA-001
- Severity: Medium
- Location: `lib/server/repository.ts:96-110`
- Evidence:
  - `withRepositoryBackend(...)` silently falls back to in-memory storage whenever Firestore is unavailable or disabled.
- Impact: Orders, entitlements, sessions, and moderation state can diverge or disappear across process restarts during backend outages. That is an integrity risk for payment claims, access control, and moderation actions.
- Fix: Fail closed for security-sensitive records such as orders, entitlements, admin state, and active sessions instead of transparently switching to process memory.
- Mitigation: Split the fallback policy by data class so read-only cacheable data can degrade gracefully, while payment/access/moderation flows return explicit maintenance errors.
- False positive notes: This is more integrity and operational risk than direct exploitability, but it affects security-relevant state.

## Open Questions / Verify

1. Guest-session mutation routes rely on signed cookies and `SameSite=Lax`, but there is no explicit Origin/CSRF validation on state-changing device/session/public-stream endpoints. If same-site subdomains or embedded trusted origins exist, add explicit origin checks or CSRF tokens.
2. The wallet sign-in routes at `app/api/auth/nonce/route.ts` and `app/api/auth/verify/route.ts` also have no visible abuse throttling. That is less severe than the hidden admin surface, but worth tightening to reduce enumeration and login flooding.

## Non-Security Risks Worth Tracking

1. The temporary external probe folders are excluded from typecheck/test/build rather than deleted because the current environment blocked removal. They are harmless to the app checks now, but should be cleaned out later.
2. The vendored skills tree is intentionally treated as data, not compiled source. Keep it excluded from app build tooling so example files in that repo do not break CI.
