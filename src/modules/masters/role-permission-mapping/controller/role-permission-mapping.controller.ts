import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiAuth,
  ApiRateLimited,
} from '../../../../common/decorators/api-auth.decorator';
import {
  ApiCreatedEnvelope,
  ApiOkEmptyEnvelope,
  ApiOkEnvelope,
} from '../../../../common/decorators/api-envelope.decorator';
import { ApiMessage } from '../../../../common/decorators/api-message.decorator';
import { ParseBigIntIdPipe } from '../../../../common/pipes/parse-bigint-id.pipe';
import { RequirePermission } from '../../../permissions/decorators/permissions.decorator';
import { PermissionCode } from '../../../permissions/helpers/master-permissions';
import { CreateRolePermissionMappingDto } from '../dto/request/create-role-permission-mapping.req.dto';
import { ListRoleMappingsQueryDto } from '../../shared/dto/request/list-role-mappings.query.dto';
import { RolePermissionMappingResponseDto } from '../dto/response/role-permission-mapping.res.dto';
import { RolePermissionMappingService } from '../service/role-permission-mapping.service';

@ApiTags('master-role-permissions')
@ApiAuth()
@RequirePermission(PermissionCode.ROLE_PERMISSION_VIEW)
@Controller('masters/role-permissions')
export class RolePermissionMappingController {
  constructor(private readonly mappings: RolePermissionMappingService) {}

  @Get()
  @ApiMessage('Role permission mappings retrieved')
  @ApiOperation({ summary: 'List role permission mappings' })
  @ApiOkEnvelope(RolePermissionMappingResponseDto, true)
  @ApiRateLimited()
  list(
    @Query() query: ListRoleMappingsQueryDto,
  ): Promise<RolePermissionMappingResponseDto[]> {
    return this.mappings.list(query.roleId);
  }

  @Get(':roleId/:permissionId')
  @ApiMessage('Role permission mapping retrieved')
  @ApiOperation({ summary: 'Get a role permission mapping' })
  @ApiOkEnvelope(RolePermissionMappingResponseDto)
  @ApiRateLimited()
  get(
    @Param('roleId', ParseBigIntIdPipe) roleId: string,
    @Param('permissionId', ParseBigIntIdPipe) permissionId: string,
  ): Promise<RolePermissionMappingResponseDto> {
    return this.mappings.get(roleId, permissionId);
  }

  @Post()
  @RequirePermission(PermissionCode.ROLE_PERMISSION_CREATE)
  @ApiMessage('Role permission mapping created')
  @ApiOperation({ summary: 'Create a role permission mapping' })
  @ApiCreatedEnvelope(RolePermissionMappingResponseDto)
  @ApiRateLimited()
  create(
    @Body() dto: CreateRolePermissionMappingDto,
  ): Promise<RolePermissionMappingResponseDto> {
    return this.mappings.create(dto);
  }

  @Delete(':roleId/:permissionId')
  @RequirePermission(PermissionCode.ROLE_PERMISSION_DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiMessage('Role permission mapping deleted')
  @ApiOperation({ summary: 'Delete a role permission mapping' })
  @ApiOkEmptyEnvelope()
  @ApiRateLimited()
  async remove(
    @Param('roleId', ParseBigIntIdPipe) roleId: string,
    @Param('permissionId', ParseBigIntIdPipe) permissionId: string,
  ): Promise<null> {
    await this.mappings.remove(roleId, permissionId);
    return null;
  }
}
