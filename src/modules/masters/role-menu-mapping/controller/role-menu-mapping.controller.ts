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
import { CreateRoleMenuMappingDto } from '../dto/request/create-role-menu-mapping.req.dto';
import { ListRoleMappingsQueryDto } from '../../shared/dto/request/list-role-mappings.query.dto';
import { RoleMenuMappingResponseDto } from '../dto/response/role-menu-mapping.res.dto';
import { RoleMenuMappingService } from '../service/role-menu-mapping.service';

@ApiTags('master-role-menus-mapping')
@ApiAuth()
@RequirePermission(PermissionCode.ROLE_MENU_VIEW)
@Controller('masters/role-menus')
export class RoleMenuMappingController {
  constructor(private readonly mappings: RoleMenuMappingService) {}

  @Get()
  @ApiMessage('Role menu mappings retrieved')
  @ApiOperation({ summary: 'List role menu mappings' })
  @ApiOkEnvelope(RoleMenuMappingResponseDto, true)
  @ApiRateLimited()
  list(
    @Query() query: ListRoleMappingsQueryDto,
  ): Promise<RoleMenuMappingResponseDto[]> {
    return this.mappings.list(query.roleId);
  }

  @Get(':roleId/:menuId')
  @ApiMessage('Role menu mapping retrieved')
  @ApiOperation({ summary: 'Get a role menu mapping' })
  @ApiOkEnvelope(RoleMenuMappingResponseDto)
  @ApiRateLimited()
  get(
    @Param('roleId', ParseBigIntIdPipe) roleId: string,
    @Param('menuId', ParseBigIntIdPipe) menuId: string,
  ): Promise<RoleMenuMappingResponseDto> {
    return this.mappings.get(roleId, menuId);
  }

  @Post()
  @RequirePermission(PermissionCode.ROLE_MENU_CREATE)
  @ApiMessage('Role menu mapping created')
  @ApiOperation({ summary: 'Create a role menu mapping' })
  @ApiCreatedEnvelope(RoleMenuMappingResponseDto)
  @ApiRateLimited()
  create(
    @Body() dto: CreateRoleMenuMappingDto,
  ): Promise<RoleMenuMappingResponseDto> {
    return this.mappings.create(dto);
  }

  @Delete(':roleId/:menuId')
  @RequirePermission(PermissionCode.ROLE_MENU_DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiMessage('Role menu mapping deleted')
  @ApiOperation({ summary: 'Delete a role menu mapping' })
  @ApiOkEmptyEnvelope()
  @ApiRateLimited()
  async remove(
    @Param('roleId', ParseBigIntIdPipe) roleId: string,
    @Param('menuId', ParseBigIntIdPipe) menuId: string,
  ): Promise<null> {
    await this.mappings.remove(roleId, menuId);
    return null;
  }
}
