# Go-live security checklist

Required before production traffic. Check every box.

## Edge / same-origin

- [ ] Public browser origin is **only** the app host (nginx or equivalent LB)
- [ ] `location /api/` proxies to Nest; `location /auth/` proxies to Nest (SuperTokens); `location /` serves the SPA
- [ ] TLS terminates at the edge (or upstream); local HTTP is a documented caveat only
- [ ] `PUBLIC_APP_URL` matches the public HTTPS origin (no Nest `:8084` in browser URLs)
- [ ] `FRONTEND_URL` is unset (or identical to `PUBLIC_APP_URL` — invite links use `PUBLIC_APP_URL`)
- [ ] `TRUST_PROXY=true` when Nest is behind nginx / LB
- [ ] SPA `VITE_API_BASE_URL` matches Nest `/{API_PREFIX}/v{API_VERSION}` (relative, same origin) — **not** a direct Nest URL
- [ ] SPA `VITE_SUPERTOKENS_API_DOMAIN` equals Nest `SUPERTOKENS_API_DOMAIN` (public edge origin)
- [ ] SPA `VITE_SUPERTOKENS_API_BASE_PATH` equals Nest `SUPERTOKENS_API_BASE_PATH` (default `/auth`)
- [ ] Do **not** treat Vite `server.proxy` as the security model; browser always hits the edge

## SuperTokens Core / sessions

- [ ] SuperTokens Core is **private** (not on the public internet); Nest reaches it via `SUPERTOKENS_CONNECTION_URI`
- [ ] `SUPERTOKENS_API_KEY` is rotated and ≥ 32 characters (not the compose default)
- [ ] Core DB is dedicated Postgres (compose `postgres-supertokens`); backups and retention are intentional
- [ ] Session cookies are SuperTokens-managed (httpOnly); SPA never stores access/refresh tokens in web storage
- [ ] Core `ACCESS_TOKEN_VALIDITY` is intentional (Sofa default: 900 seconds = 15 minutes)
- [ ] Core `REFRESH_TOKEN_VALIDITY` is intentional (Sofa local default: 10080 minutes = 7 days)
- [ ] `Session.init({ getTokenTransferMethod: () => "any" })` — cookie for SPA, header (`st-auth-mode: header`) for the extension
- [ ] Global guards: `SofaSuperTokensAuthGuard` (official `PublicAccess` / `VerifySession` + `checkDatabase: true`) + `SofaSessionUserGuard`
- [ ] Public Nest routes use `@Public()` / `@PublicAccess()`; coarse ST roles use `@VerifySession({ roles: ['owner'|'member'|'superadmin'] })`
- [ ] Sign-up form fields + `signUpPOST` override provision Sofa user/org (or invite); failed provision deletes the SuperTokens user
- [ ] `UserMetadata.init()` + signup writes `first_name` / `last_name` (dashboard First/Last Name)
- [ ] `UserRoles.init({ skipAddingPermissionsToAccessToken: true })` — store only `superadmin|owner|member` in SuperTokens; **no** permission codes in ST
- [ ] Owner signup assigns ST role `owner`; invite signup assigns `member`; `superadmin` is assigned intentionally (ops), not via public signup
- [ ] `Dashboard.init()` enabled; dashboard at `{SUPERTOKENS_API_DOMAIN}/auth/dashboard` is not public without credentials
- [ ] Dashboard users created via Core API (not app signup); set `SUPERTOKENS_DASHBOARD_ADMINS` in prod for write lockdown

## Auth identity

- [ ] `NODE_ENV=production`
- [ ] Passwords live in SuperTokens Core only; Sofa `users` has `auth_user_id` and **no** `password_hash`
- [ ] Fine-grained permissions stay in MySQL (`role_permission_mapping`); SuperTokens holds coarse role only
- [ ] Login/sign-up for the SPA use `supertokens-web-js` (`signIn` / `signUp`) — not custom Nest credential endpoints
- [ ] No Keycloak / OIDC redirect URIs remain in edge or SPA config

## Secrets and TLS

- [ ] No default compose secrets (`admin`/`admin`, `minioadmin`)
- [ ] Secrets injected via vault/secret manager or platform secrets — not committed `.env`
- [ ] `MYSQL_SSL` / `REDIS_TLS` / `KAFKA_SSL` enabled as appropriate for the environment
- [ ] Redis requires a password (or equivalent network isolation)
- [ ] Prod nginx (or LB) uses real certs; local may use mkcert / self-signed volume

## App hardening

- [ ] `CORS_ORIGINS` is an explicit production allowlist (no `*`) — same-origin reduces need, but keep tight; includes SuperTokens CORS headers
- [ ] `SWAGGER_ENABLED=false`, or basic auth credentials are strong and unique
- [ ] `CLAMAV_ENABLED=true` and Nest boot + readiness fail closed if ClamAV is down
- [ ] Nest boot verifies Mail (SMTP `verify` / Resend API) and Kafka; process must not listen if either fails
- [ ] MySQL / Redis / ClamAV / MinIO / Kafka / SuperTokens Core are **not** published on the public internet

## Frontend session

- [ ] Boot uses `Session.doesSessionExist()` + `/api/v1/auth/me` seed; 401 after revoke clears local session
- [ ] Single-flight 401 → `Session.attemptRefreshingSession()` → retry once → else login
- [ ] Proactive refresh via `Session.attemptRefreshingSession` before access-token `exp`
- [ ] Sign-out uses `Session.signOut()`
- [ ] Zero token persistence in `localStorage` / `sessionStorage`
