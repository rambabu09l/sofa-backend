import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiAuth,
  ApiRateLimited,
} from '../../../common/decorators/api-auth.decorator';
import { ApiOkEnvelope } from '../../../common/decorators/api-envelope.decorator';
import { ApiMessage } from '../../../common/decorators/api-message.decorator';
import { ListPermissionsQueryDto } from '../dto/request/list-permissions.query.dto';
import { PermissionCatalogResponseDto } from '../dto/response/permission-catalog.res.dto';
import { PermissionCatalogService } from '../service/permission-catalog.service';
import { AllowAuthenticated } from '../decorators/allow-authenticated.decorator';

@ApiTags('permissions')
@ApiAuth()
@AllowAuthenticated()
@Controller('permissions')
export class PermissionCatalogController {
  constructor(private readonly catalog: PermissionCatalogService) {}

  @Get()
  @ApiMessage('Permissions retrieved')
  @ApiOperation({
    summary: 'List active permission catalog rows filtered by scope',
    description:
      'Use scope=PROJECT for project member permission pickers (only master_permissions with scope PROJECT). Use scope=ORG for organization permissions.',
  })
  @ApiOkEnvelope(PermissionCatalogResponseDto, true)
  @ApiRateLimited()
  list(
    @Query() query: ListPermissionsQueryDto,
  ): Promise<PermissionCatalogResponseDto[]> {
    return this.catalog.listByScope(query.scope);
  }
}
