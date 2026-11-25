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
import { CreateMasterMenuDto } from '../dto/request/create-master-menu.req.dto';
import { ListMastersQueryDto } from '../../shared/dto/request/list-masters.query.dto';
import { UpdateMasterMenuDto } from '../dto/request/update-master-menu.req.dto';
import { MasterMenuResponseDto } from '../dto/response/master-menu.res.dto';
import { MasterMenuService } from '../service/master-menu.service';

@ApiTags('master-menus')
@ApiAuth()
@RequirePermission(PermissionCode.MENU_VIEW)
@Controller('masters/menus')
export class MasterMenuController {
  constructor(private readonly menus: MasterMenuService) {}

  @Get()
  @ApiMessage('Master menus retrieved')
  @ApiOperation({ summary: 'List master menus' })
  @ApiOkEnvelope(MasterMenuResponseDto, true)
  @ApiRateLimited()
  list(
    @Query() query: ListMastersQueryDto,
  ): Promise<MasterMenuResponseDto[]> {
    return this.menus.list(query.includeInactive ?? false);
  }

  @Get(':id')
  @ApiMessage('Master menu retrieved')
  @ApiOperation({ summary: 'Get a master menu by id' })
  @ApiOkEnvelope(MasterMenuResponseDto)
  @ApiRateLimited()
  getById(
    @Param('id', ParseBigIntIdPipe) id: string,
  ): Promise<MasterMenuResponseDto> {
    return this.menus.getById(id);
  }

  @Post()
  @RequirePermission(PermissionCode.MENU_CREATE)
  @ApiMessage('Master menu created')
  @ApiOperation({ summary: 'Create a master menu' })
  @ApiCreatedEnvelope(MasterMenuResponseDto)
  @ApiRateLimited()
  create(@Body() dto: CreateMasterMenuDto): Promise<MasterMenuResponseDto> {
    return this.menus.create(dto);
  }

  @Patch(':id')
  @RequirePermission(PermissionCode.MENU_UPDATE)
  @ApiMessage('Master menu updated')
  @ApiOperation({ summary: 'Update a master menu' })
  @ApiOkEnvelope(MasterMenuResponseDto)
  @ApiRateLimited()
  update(
    @Param('id', ParseBigIntIdPipe) id: string,
    @Body() dto: UpdateMasterMenuDto,
  ): Promise<MasterMenuResponseDto> {
    return this.menus.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(PermissionCode.MENU_DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiMessage('Master menu deleted')
  @ApiOperation({ summary: 'Soft-delete a master menu' })
  @ApiOkEmptyEnvelope()
  @ApiRateLimited()
  async remove(@Param('id', ParseBigIntIdPipe) id: string): Promise<null> {
    await this.menus.remove(id);
    return null;
  }
}
