import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { CreateMasterRoleDto } from '../dto/request/create-master-role.req.dto';
import { ListMastersQueryDto } from '../../shared/dto/request/list-masters.query.dto';
import { UpdateMasterRoleDto } from '../dto/request/update-master-role.req.dto';
import { MasterRoleResponseDto } from '../dto/response/master-role.res.dto';
import { MasterRoleService } from '../service/master-role.service';

@ApiTags('master-roles')
@ApiAuth()
@RequirePermission(PermissionCode.ROLE_VIEW)
@Controller('masters/roles')
export class MasterRoleController {
  constructor(private readonly roles: MasterRoleService) {}

  @Get()
  @ApiMessage('Master roles retrieved')
  @ApiOperation({ summary: 'List master roles' })
  @ApiOkEnvelope(MasterRoleResponseDto, true)
  @ApiRateLimited()
  list(
    @Query() query: ListMastersQueryDto,
  ): Promise<MasterRoleResponseDto[]> {
    return this.roles.list(query.includeInactive ?? false);
  }

  @Get(':id')
  @ApiMessage('Master role retrieved')
  @ApiOperation({ summary: 'Get a master role by id' })
  @ApiOkEnvelope(MasterRoleResponseDto)
  @ApiRateLimited()
  getById(
    @Param('id', ParseBigIntIdPipe) id: string,
  ): Promise<MasterRoleResponseDto> {
    return this.roles.getById(id);
  }

  @Post()
  @RequirePermission(PermissionCode.ROLE_CREATE)
  @ApiMessage('Master role created')
  @ApiOperation({ summary: 'Create a master role' })
  @ApiCreatedEnvelope(MasterRoleResponseDto)
  @ApiRateLimited()
  create(@Body() dto: CreateMasterRoleDto): Promise<MasterRoleResponseDto> {
    return this.roles.create(dto);
  }

  @Patch(':id')
  @RequirePermission(PermissionCode.ROLE_UPDATE)
  @ApiMessage('Master role updated')
  @ApiOperation({ summary: 'Update a master role' })
  @ApiOkEnvelope(MasterRoleResponseDto)
  @ApiRateLimited()
  update(
    @Param('id', ParseBigIntIdPipe) id: string,
    @Body() dto: UpdateMasterRoleDto,
  ): Promise<MasterRoleResponseDto> {
    return this.roles.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(PermissionCode.ROLE_DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiMessage('Master role deleted')
  @ApiOperation({ summary: 'Soft-delete a master role' })
  @ApiOkEmptyEnvelope()
  @ApiRateLimited()
  async remove(@Param('id', ParseBigIntIdPipe) id: string): Promise<null> {
    await this.roles.remove(id);
    return null;
  }
}
