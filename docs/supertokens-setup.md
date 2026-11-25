# SuperTokens setup (Sofa)

Plain-language guide for local SuperTokens: Docker, accounts, roles, and the dashboard.

## What lives where

Sofa uses **self-hosted** SuperTokens. Think of three layers:

| Layer | What it is | Stores |
| --- | --- | --- |
| **SuperTokens Core** | Docker service on `127.0.0.1:3568` | Passwords, sessions, SuperTokens roles, user metadata |
| **Core database** | Docker Postgres (`postgres-supertokens`) | Core’s own data (not Sofa MySQL) |
| **Nest + SPA** | App code | Sofa users/orgs/permissions in MySQL; Nest talks to Core; the browser talks to Nest via nginx |

The browser never talks to Core directly. Flow:

```text
Browser  →  nginx (:8089)  →  Nest (:8084)  →  SuperTokens Core (:3568)
              /auth/*            /auth/*
              /api/v1/*
```

- Passwords live **only** in SuperTokens Core.
- Sofa MySQL `users.auth_user_id` links to the SuperTokens user id.
- Fine-grained permissions (who can invite, edit tickets, …) stay in **MySQL**. SuperTokens only holds the coarse role: `superadmin` | `owner` | `member`.

## 1. One-time env setup

From `backend_v2/`:

```bash
cp .env.example .env
```

Set at least:

```bash
# Generate a real key (do not ship the example value to prod)
openssl rand -hex 32
```

Put that value in `.env` as `SUPERTOKENS_API_KEY` (min 32 characters). Local example vars that must stay in sync:

| Backend (Nest) | Frontend (Vite) | Meaning |
| --- | --- | --- |
| `SUPERTOKENS_API_DOMAIN=http://localhost:8089` | `VITE_SUPERTOKENS_API_DOMAIN=http://localhost:8089` | Public origin the **browser** uses (nginx) |
| `SUPERTOKENS_API_BASE_PATH=/auth` | `VITE_SUPERTOKENS_API_BASE_PATH=/auth` | Path Nest mounts SuperTokens APIs on |
| `SUPERTOKENS_CONNECTION_URI=http://127.0.0.1:3568` | — | Nest → Core (host only; not public) |
| `SUPERTOKENS_API_KEY=…` | — | Must match Core `API_KEYS` in Compose |
| `PUBLIC_APP_URL=http://localhost:8089` | — | Cookies, invites, CORS |

Frontend `.env` (or `.env.example`):

```bash
VITE_API_BASE_URL=/api/v1
VITE_APP_NAME=Sofa
VITE_SUPERTOKENS_API_DOMAIN=http://localhost:8089
VITE_SUPERTOKENS_API_BASE_PATH=/auth
```

## 2. Spin up SuperTokens in Docker

From `backend_v2/`:

```bash
npm run docker:up
```

That starts (among other services):

- `postgres-supertokens` — Postgres for Core
- `supertokens` — SuperTokens Core (bound to **localhost only**)
- `mysql`, `redis`, `nginx` — app stack

Check Core is healthy:

```bash
curl -s http://127.0.0.1:3568/hello
# expect: Hello
```

Useful Compose commands:

```bash
npm run docker:logs          # follow Core + MySQL + nginx, etc.
docker compose ps            # status
npm run docker:down          # stop (volumes kept)
```

Core image/pin and refresh lifetime come from `.env`:

- `SUPERTOKENS_IMAGE` (default `supertokens/supertokens-postgresql:12.5.0`)
- `SUPERTOKENS_ACCESS_TOKEN_VALIDITY_SECONDS` (default `900` = 15 minutes)
- `SUPERTOKENS_REFRESH_TOKEN_VALIDITY_MINUTES` (default `10080` = 7 days)

## 3. Start Nest and the SPA

```bash
# backend_v2
npm install
npm run migration:run
npm run start:dev

# frontend (separate terminal)
npm install
npm run dev
```

Open the app through the edge (not Nest’s port alone):

- App: [http://localhost:8089](http://localhost:8089)
- Nest Swagger (direct): [http://localhost:8084/docs](http://localhost:8084/docs)

On Nest boot, Sofa ensures the three SuperTokens **role definitions** exist (`superadmin`, `owner`, `member`) with empty permission lists. That is automatic — you do not create those roles by hand for normal local use.

## 4. Creating app accounts

### Owner (new organization)

1. Open [http://localhost:8089/sign-up](http://localhost:8089/sign-up).
2. Enter first name, last name, email, password, organization name.
3. Submit.

What happens:

1. SPA calls SuperTokens `signUp` (EmailPassword) → Core creates the auth user + password.
2. Nest’s `signUpPOST` override creates the Sofa user + organization (owner) in MySQL.
3. Nest assigns SuperTokens role **`owner`**.
4. First/last name go into SuperTokens UserMetadata (`first_name` / `last_name`).
5. If Sofa provisioning fails, Nest **deletes** the SuperTokens user so you do not leave a login with no app row.

### Invited member

1. An owner invites someone in the org UI (MySQL invitation row only — **no** SuperTokens user yet).
2. Invitee opens the invite link → invite sign-up page.
3. They set name + password (email is fixed to the invitation).

What happens:

1. SPA calls SuperTokens `signUp` with form field `invitation_token`.
2. Core creates the auth user.
3. Nest accepts the invite, creates the Sofa user, joins the org (and optional custom role).
4. Nest assigns SuperTokens role **`member`**.

### Sign in (existing user)

Use [http://localhost:8089/login](http://localhost:8089/login). SPA uses SuperTokens `signIn`. Session cookies are set by SuperTokens (httpOnly). The SPA does **not** store access/refresh tokens in localStorage.

## 5. Roles (how they work)

### Coarse roles (SuperTokens)

| Role | How you get it |
| --- | --- |
| `owner` | Automatic on public org sign-up |
| `member` | Automatic on invite sign-up |
| `superadmin` | **Not** from public signup — assign on purpose (ops) |

These are SuperTokens UserRoles. Nest can gate routes with `@VerifySession({ roles: ['owner'] })`. The access token carries `st-role`; Nest `/api/v1/auth/me` exposes `appRole`.

Sofa **does not** put permission codes into SuperTokens. MySQL owns fine-grained RBAC (`role_permission_mapping`, org custom roles, grants).

### Assign / change a SuperTokens role (ops)

Roles are created on Nest startup via `ensureSuperTokensAppRoles()`. Assignment in product code uses `assignSuperTokensAppRole(...)`.

For a one-off **superadmin** on an existing SuperTokens user (local/ops), use the User Roles recipe against Core (replace `USER_ID` and the API key):

```bash
# List roles for a user (tenant "public")
curl -s -X GET 'http://127.0.0.1:3568/recipe/user/role?userId=USER_ID&tenantId=public' \
  -H "api-key: $SUPERTOKENS_API_KEY"

# Add role
curl -s -X PUT 'http://127.0.0.1:3568/recipe/user/role' \
  -H "api-key: $SUPERTOKENS_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"USER_ID","role":"superadmin","tenantId":"public"}'
```

Find `USER_ID` in the SuperTokens dashboard (Users), or from Sofa MySQL `users.auth_user_id`.

After changing roles, the user should sign out and sign in (or refresh the session) so `st-role` updates.

## 6. SuperTokens user management dashboard

URL (through nginx → Nest → Core):

[http://localhost:8089/auth/dashboard](http://localhost:8089/auth/dashboard)

Dashboard logins are **separate** from Sofa app accounts. Create the first dashboard user against **Core** (not the SPA sign-up form):

```bash
# Load key from backend_v2/.env, then:
export SUPERTOKENS_API_KEY='paste-your-key-here'

curl -s -X POST 'http://127.0.0.1:3568/recipe/dashboard/user' \
  -H "api-key: $SUPERTOKENS_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@sofa.local",
    "password": "SofaDash1!"
  }'
```

Then open the dashboard URL and sign in with that email/password.

Optional lockdown: set `SUPERTOKENS_DASHBOARD_ADMINS=admin@sofa.local` in Nest `.env` so only listed emails can write in the dashboard. Empty = all dashboard users can write (fine for local).

## 7. Quick verification checklist

```bash
# Core up?
curl -s http://127.0.0.1:3568/hello

# Nest up?
curl -s http://127.0.0.1:8084/health/live

# Edge proxies /auth?
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8089/auth/dashboard
```

Then:

1. Sign up a new owner at `/sign-up`.
2. Confirm a row in MySQL `users` with `auth_user_id` set.
3. Open the dashboard → user appears; role should be `owner`.
4. Invite a second email → accept invite → that user has role `member`.

## 8. Common mistakes

| Mistake | Fix |
| --- | --- |
| Opening the SPA on Vite’s port only and breaking cookies | Use **http://localhost:8089** (nginx). `apiDomain` must be that origin. |
| Pointing `VITE_SUPERTOKENS_API_DOMAIN` at Core `:3568` | Wrong. Browser → Nest `/auth`. Nest → Core. |
| Nest `SUPERTOKENS_API_KEY` ≠ Core `API_KEYS` | Same value in `.env`; recreate Core if you changed it after first start. |
| Expecting invite email to create a SuperTokens user | Invite is MySQL-only until the invitee signs up. |
| Putting Sofa permissions into SuperTokens | Don’t. Keep `skipAddingPermissionsToAccessToken: true`; permissions stay in MySQL. |
| Exposing Core port publicly | Compose binds `127.0.0.1:3568` on purpose. Keep it private. |

## Related

- Go-live checklist: [`go-live-security.md`](./go-live-security.md)
- Nest SuperTokens config: `src/config/supertokens.config.ts`
- Role helpers: `src/config/supertokens-roles.ts`
- Official docs: [Self-host SuperTokens](https://supertokens.com/docs/deployment/self-host-supertokens), [Dashboard](https://supertokens.com/docs/post-authentication/dashboard/initial-setup), [User roles](https://supertokens.com/docs/additional-verification/user-roles/protecting-a-route)
