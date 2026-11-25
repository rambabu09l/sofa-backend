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
import { CreateMasterPermissionDto } from '../dto/request/create-master-permission.req.dto';
import { ListMastersQueryDto } from '../../shared/dto/request/list-masters.query.dto';
import { UpdateMasterPermissionDto } from '../dto/request/update-master-permission.req.dto';
import { MasterPermissionResponseDto } from '../dto/response/master-permission.res.dto';
import { MasterPermissionService } from '../service/master-permission.service';

@ApiTags('master-permissions')
@ApiAuth()
@RequirePermission(PermissionCode.PERMISSION_VIEW)
@Controller('masters/permissions')
export class MasterPermissionController {
  constructor(private readonly permissions: MasterPermissionService) {}

  @Get()
  @ApiMessage('Master permissions retrieved')
  @ApiOperation({ summary: 'List master permissions' })
  @ApiOkEnvelope(MasterPermissionResponseDto, true)
  @ApiRateLimited()
  list(
    @Query() query: ListMastersQueryDto,
  ): Promise<MasterPermissionResponseDto[]> {
    return this.permissions.list(query.includeInactive ?? false);
  }

  @Get(':id')
  @ApiMessage('Master permission retrieved')
  @ApiOperation({ summary: 'Get a master permission by id' })
  @ApiOkEnvelope(MasterPermissionResponseDto)
  @ApiRateLimited()
  getById(
    @Param('id', ParseBigIntIdPipe) id: string,
  ): Promise<MasterPermissionResponseDto> {
    return this.permissions.getById(id);
  }

  @Post()
  @RequirePermission(PermissionCode.PERMISSION_CREATE)
  @ApiMessage('Master permission created')
  @ApiOperation({ summary: 'Create a master permission' })
  @ApiCreatedEnvelope(MasterPermissionResponseDto)
  @ApiRateLimited()
  create(
    @Body() dto: CreateMasterPermissionDto,
  ): Promise<MasterPermissionResponseDto> {
    return this.permissions.create(dto);
  }

  @Patch(':id')
  @RequirePermission(PermissionCode.PERMISSION_UPDATE)
  @ApiMessage('Master permission updated')
  @ApiOperation({ summary: 'Update a master permission' })
  @ApiOkEnvelope(MasterPermissionResponseDto)
  @ApiRateLimited()
  update(
    @Param('id', ParseBigIntIdPipe) id: string,
    @Body() dto: UpdateMasterPermissionDto,
  ): Promise<MasterPermissionResponseDto> {
    return this.permissions.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(PermissionCode.PERMISSION_DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiMessage('Master permission deleted')
  @ApiOperation({ summary: 'Soft-delete a master permission' })
  @ApiOkEmptyEnvelope()
  @ApiRateLimited()
  async remove(@Param('id', ParseBigIntIdPipe) id: string): Promise<null> {
    await this.permissions.remove(id);
    return null;
  }
}
