# Controller authorization decorators

Sofa is **fail-closed** at the controller boundary. Every Nest route must declare one of the decorators below. Routes with none of them return **403**.

Guards run globally (see `app.module.ts`):

1. SuperTokens session (`SofaSuperTokensAuthGuard`)
2. Map session → `AuthUser` (`SofaSessionUserGuard`)
3. Fail-closed + SYSTEM permissions (`PermissionsGuard`)
4. Org permissions (`OrgPermissionGuard`)
5. Project permissions (`ProjectPermissionGuard`)

## Which decorator to use

| Decorator | When | What it checks |
|---|---|---|
| `@Public()` | No login required (health, OAuth callbacks, invite preview) | Skips session + permission checks |
| `@RequirePermission(...codes)` | SYSTEM / platform admin APIs (`/masters/*`, `/billing/*`) | Any one SYSTEM code |
| `@RequireOrgPermission(...codes)` | Org-scoped APIs under `organizations/:organizationId/...` | Any one ORGANIZATION code for that org |
| `@RequireProjectPermission(...codes)` | Project-scoped APIs under `.../projects/:projectId/...` | Any one PROJECT code for that project |
| `@AllowAuthenticated()` | Session required; authz is membership / self / service-only | User is logged in (provisioned) |
| `@AllowAuthenticated()` + `@AllowUnprovisionedSession()` | Google/social complete-signup (`/auth/social-provisioning`, …) | SuperTokens session required; attaches Sofa user when present, else allows without |

**Mutations and sensitive reads** should use `@RequireOrgPermission` or `@RequireProjectPermission` (or SYSTEM `@RequirePermission`), not only `@AllowAuthenticated`.

`@AllowAuthenticated` is for:

- Self-scoped routes (`/auth/me`, notifications)
- Soft reads that only need “active org member” / project access enforced in the service
- Temporary coverage while a route still relies on service-layer checks

Pair `@AllowUnprovisionedSession()` with `@AllowAuthenticated()` on social complete-signup only. The session-user guard attaches `request.user` when the Sofa row exists; `PermissionsGuard` allows a missing user only with that pair.

## Imports

```ts
import { Public } from '../common/decorators/public.decorator'; // adjust relative path
import { AllowAuthenticated } from '../modules/permissions/decorators/allow-authenticated.decorator';
import { RequirePermission } from '../modules/permissions/decorators/permissions.decorator';
import { RequireOrgPermission } from '../modules/permissions/decorators/require-org-permission.decorator';
import { RequireProjectPermission } from '../modules/permissions/decorators/require-project-permission.decorator';
import { PermissionCode } from '../modules/permissions/helpers/master-permissions';
```

Prefer `PermissionCode.*` over raw strings.

## Examples

### Public route

```ts
@Public()
@Controller('health')
export class HealthController {
  @Get('live')
  live() {
    return { status: 'ok' };
  }
}
```

### SYSTEM permission (billing / masters)

```ts
@RequirePermission(PermissionCode.BILLING_PRODUCT_VIEW)
@Controller('billing/products')
export class ProductController {
  @Get()
  list() { /* ... */ }

  @Post()
  @RequirePermission(PermissionCode.BILLING_PRODUCT_CREATE)
  create(@Body() dto: CreateProductDto) { /* ... */ }
}
```

Class-level `@RequirePermission` applies to all handlers; method-level overrides/adds as Nest metadata override rules allow. Prefer **method-level** for different codes per verb.

Multiple codes are **OR** (any one allows):

```ts
@RequirePermission(
  PermissionCode.ROLE_VIEW,
  PermissionCode.ROLE_CREATE,
)
```

### Organization permission

Route must expose `organizationId`:

```ts
@ApiAuth()
@AllowAuthenticated() // class fallback for membership-only GETs
@Controller('organizations/:organizationId/members')
export class OrganizationMemberController {
  @Get()
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.members.list(organizationId, user);
  }

  @Delete(':userId')
  @RequireOrgPermission(PermissionCode.ORG_MEMBER_REMOVE)
  async remove(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('userId', ParseUUIDPipe) memberUserId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.members.remove(organizationId, memberUserId, user);
    return null;
  }
}
```

OR of org codes:

```ts
@RequireOrgPermission(
  PermissionCode.ORG_MEMBER_INVITE,
  PermissionCode.ORG_INVITE_REVOKE,
)
@Get()
listInvitations(...) { /* ... */ }
```

### Project permission

Route must expose both `organizationId` and `projectId`:

```ts
@ApiAuth()
@AllowAuthenticated()
@Controller('organizations/:organizationId/projects/:projectId/tickets')
export class TicketController {
  @Get()
  @RequireProjectPermission(PermissionCode.TICKET_VIEW)
  list(...) { /* ... */ }

  @Post()
  @RequireProjectPermission(PermissionCode.TICKET_CREATE)
  create(...) { /* ... */ }

  @Patch(':ticketId')
  @RequireProjectPermission(PermissionCode.TICKET_EDIT)
  update(...) { /* ... */ }
}
```

Org-level action that creates a project (no `projectId` yet):

```ts
@Post()
@RequireOrgPermission(PermissionCode.ORG_PROJECT_CREATE)
create(
  @Param('organizationId', ParseUUIDPipe) organizationId: string,
  @Body() dto: CreateProjectDto,
  @CurrentUser() user: AuthUser,
) {
  return this.projects.create(organizationId, dto, user.id);
}
```

### Authenticated only (no catalog permission code)

```ts
@ApiAuth()
@AllowAuthenticated()
@Controller('auth')
export class AuthController {
  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.auth.getMe(user);
  }
}
```

## Rules of thumb

1. **New controller?** Put `@AllowAuthenticated()` (or `@Public()` / `@RequirePermission`) on the class so unmarked methods are not 403’d by accident — then tighten methods with org/project codes.
2. **New mutating endpoint?** Add `@RequireOrgPermission` or `@RequireProjectPermission` with the same `PermissionCode` the service already (or should) enforce.
3. **Guards are not enough for instance rules.** Owner transfer, “only assignee”, etc. stay in the service. Guards check **catalog codes**, not business exceptions.
4. **Do not invent param names.** Org guard reads `params.organizationId`; project guard reads `params.organizationId` + `params.projectId`.
5. **Service checks remain valuable** for internal callers and defense in depth. Controller decorators make forgetting a check harder at the HTTP boundary.

## Decision flowchart

```text
Is the route callable without login?
  └─ yes → @Public()
  └─ no → Is it SYSTEM admin (/masters, /billing catalog)?
            └─ yes → @RequirePermission(SYSTEM_CODE)
            └─ no → Does it need an ORG catalog permission?
                      └─ yes → @RequireOrgPermission(ORG_CODE)
                      └─ no → Does it need a PROJECT catalog permission?
                                └─ yes → @RequireProjectPermission(PROJECT_CODE)
                                └─ no → @AllowAuthenticated()
                                         (+ enforce membership/self in service)
```

## Related code

| Piece | Path |
|---|---|
| Permission codes | `src/modules/permissions/helpers/master-permissions.ts` |
| Fail-closed + SYSTEM guard | `src/modules/permissions/guards/permissions.guard.ts` |
| Org guard | `src/organizations/permissions/guards/org-permission.guard.ts` |
| Project guard | `src/modules/projects/project-access/guards/project-permission.guard.ts` |
| Public alias | `src/common/decorators/public.decorator.ts` |
