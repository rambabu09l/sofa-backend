# Sofa API (NestJS)

Auth-and-platform shell for Sofa. **Not** a Ticketor product clone.

Kept: Cursor rules, SuperTokens auth, users, masters (roles/permissions/menus), system permissions, and shared infra.

Removed: tickets, projects, workflows, captures, billing, integrations, organizations (members/invitations/join links/org permissions).

## Stack

- NestJS 11 + TypeORM + MySQL
- SuperTokens Core (Postgres) — passwords and sessions
- Redis, ClamAV, MinIO, Kafka, Swagger at `/docs`

## Ports (Sofa only — do not reuse Ticketor ports)

| Service | Host port |
| --- | ---: |
| API (Nest) | **8083** |
| nginx edge | **8089** |
| MySQL | **3308** |
| Redis | **6382** |
| SuperTokens Core | **3568** |
| MinIO API / console | **9010** / **9011** |
| Kafka | **9094** |
| ClamAV | **3311** |
| Mailpit SMTP / UI | **1026** / **8026** |

Containers are named `sofa-*` (e.g. `sofa-mysql`, `sofa-redis`). Volumes are `sofa_*`. DB name/user: `sofa`.

## Quick start

```bash
cd ~/Desktop/projects/sofa-backend
cp .env.example .env   # already has Sofa ports
npm install
npm run docker:up
npm run migration:run
npm run start:dev
```

If you previously ran Ticketor/org-era migrations on this DB, use a **fresh** MySQL volume (or drop the `sofa` database) before `migration:run`.

| Resource | URL |
| --- | --- |
| API | http://localhost:8083/api/v1 |
| SuperTokens recipes | http://localhost:8083/auth/* |
| Swagger | http://localhost:8083/docs |
| nginx edge | http://localhost:8089 |

## Auth

- Sign-up / sign-in: SuperTokens `/auth/signup` and `/auth/signin` (creates a Sofa user row)
- Social: after Google OAuth, finish with `POST /api/v1/auth/complete-social-signup`
- Protected Nest routes: `SofaSuperTokensAuthGuard` + `SofaSessionUserGuard`
- Profile: `GET /api/v1/auth/me`
- Passwords live only in SuperTokens Core — not in MySQL

See [`docs/supertokens-setup.md`](docs/supertokens-setup.md).

## Cursor rules

[`.cursor/rules/`](.cursor/rules/) — Nest module layout, repositories, errors, migrations.

## Frontend

Sofa Vite app: `~/Desktop/projects/sofa` → `http://localhost:5173`  
`CORS_ORIGINS` already includes that origin.
