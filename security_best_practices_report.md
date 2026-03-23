# Security Best Practices Report

## Executive Summary

The codebase is in better shape than the previous audit snapshot: REST device endpoints now go through server-side URL safety checks, admin login has basic throttling, and baseline security headers are present in app config. The main issues that still stand are availability and abuse-resistance problems on public routes plus a CSP that is permissive enough to provide limited XSS containment.

## Medium Severity

### Finding 1

- Rule ID: REACT-ABUSE-001
- Severity: Medium
- Location: `app/api/public-chat/route.ts:9-40`, `lib/server/public-chat.ts:19-22`, `lib/server/public-chat.ts:53-92`
- Evidence:
  - `app/api/public-chat/route.ts:15-34` accepts anonymous POSTs and relies on `reservePublicChatTurn()`.
  - `lib/server/public-chat.ts:19-22` defines the daily cap.
  - `lib/server/public-chat.ts:53-92` enforces the cap only through a signed browser cookie.
- Impact: The public chat quota is trivial to bypass by clearing cookies, rotating browsers, or distributing requests across clients. That creates a straightforward cost and availability abuse path against the model-backed chat endpoint.
- Fix: Add a server-side rate limiter keyed by IP and/or guest session, and keep the cookie counter only as secondary UX feedback.
- Mitigation: Put `/api/public-chat` behind edge throttling or bot protection until a durable server-side limiter exists.
- False positive notes: Signed cookies stop client-side tampering, but they do not stop replay from fresh clients.

### Finding 2

- Rule ID: NEXT-ABUSE-002
- Severity: Medium
- Location: `app/api/livestream/request/route.ts:9-42`, `app/api/livestream/verify/route.ts:11-34`, `lib/server/livestream.ts:475-498`
- Evidence:
  - `app/api/livestream/request/route.ts:9-42` creates queue requests with no explicit request throttling.
  - `app/api/livestream/verify/route.ts:11-34` verifies submitted transaction signatures with no explicit request throttling.
  - `lib/server/livestream.ts:475-498` performs on-chain verification and wallet analytics work for each verification attempt.
- Impact: A single guest can still drive expensive queue creation and payment verification traffic, which is an abuse and availability problem even though cooldown logic exists for repeated contracts and recent guest requests.
- Fix: Add `enforceRequestRateLimit(...)` to both request and verify routes, and consider a tighter limiter specifically on signature verification attempts.
- Mitigation: Apply CDN/WAF throttling and RPC quotas while application-level limits are added.
- False positive notes: Contract and guest cooldowns reduce normal repeat usage, but they do not replace endpoint-level abuse throttling.

### Finding 3

- Rule ID: NEXT-HEADERS-002
- Severity: Medium
- Location: `next.config.ts:4-16`
- Evidence:
  - `next.config.ts:12-14` sets `style-src 'unsafe-inline'` and `script-src 'self' 'unsafe-inline' 'unsafe-eval' https:`.
- Impact: The app now has a CSP, but the current script policy is permissive enough that it offers limited XSS containment. Inline script execution, eval-style execution, and broad third-party HTTPS script loading are all still allowed.
- Fix: Move toward a nonce- or hash-based CSP, remove `'unsafe-eval'`, and narrow script hosts to the exact origins the app requires.
- Mitigation: If a strict CSP cannot land immediately, document which dependencies require these relaxations and remove the wildcard `https:` script allowance first.
- False positive notes: Some tooling may temporarily require relaxed directives, but that should be documented explicitly because the current policy is broader than necessary.

## Low Severity

### Finding 4

- Rule ID: NEXT-RATE-001
- Severity: Low
- Location: `lib/server/request-security.ts:11-20`, `lib/server/request-security.ts:222-259`
- Evidence:
  - `lib/server/request-security.ts:11-20` stores rate-limit counters in a process-global `Map`.
  - `lib/server/request-security.ts:222-259` uses that in-memory store for all request throttling.
- Impact: In-memory throttling is easy to bypass in horizontally scaled or multi-instance deployments, and counters reset on process restart.
- Fix: Move rate limiting to a shared backend such as Redis, Firestore, Cloudflare, or a platform-native limiter.
- Mitigation: Treat the current limiter as a best-effort local guard only, and pair it with edge enforcement.
- False positive notes: This is acceptable for local development, but it is not durable protection for a production-hosted public app.

## Notes

1. The prior SSRF finding on REST devices appears materially reduced by `assertSafeRestEndpointUrl(...)` in `lib/server/request-security.ts`.
2. The prior admin brute-force finding is also improved because `app/api/internal-admin/auth/login/route.ts` now applies request throttling.
