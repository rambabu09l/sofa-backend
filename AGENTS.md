# sofa-backend

NestJS 11 API for Sofa with SuperTokens auth, TypeORM/MySQL, Redis, MinIO.

Auth-and-platform shell only (rules + SuperTokens + users/masters/permissions). Ticketor product domains and organizations are intentionally not present.

- Feature modules under `src/modules/<feature>/`
- Controllers stay thin; services own business rules; repositories own persistence
- TypeORM migrations only — never `MYSQL_SYNC=true` in shared/dev DB you care about
- Wrap success via the shared API envelope; throw typed service errors for expected failures
- Validation messages must be user-readable
- Soft-delete via `deletedAt` where entities support it
- Auth: SuperTokens session cookies (`/auth/*`) + `SofaSuperTokensAuthGuard` / `SofaSessionUserGuard`
- Day-to-day rules: `.cursor/rules/`
