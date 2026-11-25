import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import {
  PERMISSION_CATALOG_SCOPES,
  type PermissionCatalogScopeQuery,
} from '../../constants/permission-catalog.constants';

export class ListPermissionsQueryDto {
  @ApiProperty({
    enum: PERMISSION_CATALOG_SCOPES,
    example: 'PROJECT',
    description:
      'Filter master_permissions by scope. Use PROJECT for project member checklists; ORG for organization.',
  })
  @IsString({ message: 'scope must be a string' })
  @IsIn(PERMISSION_CATALOG_SCOPES, {
    message: 'scope must be ORG, ORGANIZATION, PROJECT, or SYSTEM',
  })
  scope!: PermissionCatalogScopeQuery;
}
