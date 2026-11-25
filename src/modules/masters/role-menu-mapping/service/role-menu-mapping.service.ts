import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { rethrowServiceError } from '../../../../common/http/service-error';
import { CreateRoleMenuMappingDto } from '../dto/request/create-role-menu-mapping.req.dto';
import { RoleMenuMappingResponseDto } from '../dto/response/role-menu-mapping.res.dto';
import { toRoleMenuMappingResponse } from '../mapper/role-menu-mapping.mapper';
import { MasterMenuRepository } from '../../menu/repository/master-menu.repository';
import { MasterRoleRepository } from '../../role/repository/master-role.repository';
import { RoleMenuMappingRepository } from '../repository/role-menu-mapping.repository';

@Injectable()
export class RoleMenuMappingService {
  private readonly logger = new Logger(RoleMenuMappingService.name);

  constructor(
    private readonly mappings: RoleMenuMappingRepository,
    private readonly roles: MasterRoleRepository,
    private readonly menus: MasterMenuRepository,
  ) {}

  async list(roleId?: string): Promise<RoleMenuMappingResponseDto[]> {
    try {
      const rows = roleId
        ? await this.mappings.findByRoleId(roleId)
        : await this.mappings.findAll();
      return rows.map(toRoleMenuMappingResponse);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        'RoleMenuMappingService.list',
        'Could not load role menu mappings',
      );
    }
  }

  async get(
    roleId: string,
    menuId: string,
  ): Promise<RoleMenuMappingResponseDto> {
    try {
      const row = await this.mappings.findOneMapping(roleId, menuId);
      if (!row) {
        throw new HttpException(
          'Role menu mapping not found',
          HttpStatus.NOT_FOUND,
        );
      }
      return toRoleMenuMappingResponse(row);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `RoleMenuMappingService.get roleId=${roleId} menuId=${menuId}`,
        'Could not load the role menu mapping',
      );
    }
  }

  async create(
    dto: CreateRoleMenuMappingDto,
  ): Promise<RoleMenuMappingResponseDto> {
    try {
      const role = await this.roles.findById(dto.roleId);
      if (!role) {
        throw new HttpException('Master role not found', HttpStatus.NOT_FOUND);
      }
      const menu = await this.menus.findById(dto.menuId);
      if (!menu) {
        throw new HttpException('Master menu not found', HttpStatus.NOT_FOUND);
      }
      const existing = await this.mappings.findOneMapping(
        dto.roleId,
        dto.menuId,
      );
      if (existing) {
        throw new HttpException(
          'Role menu mapping already exists',
          HttpStatus.CONFLICT,
        );
      }
      const saved = await this.mappings.save(
        this.mappings.create({
          roleId: dto.roleId,
          menuId: dto.menuId,
        }),
      );
      return toRoleMenuMappingResponse(saved);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        'RoleMenuMappingService.create',
        'Could not create the role menu mapping',
      );
    }
  }

  async remove(roleId: string, menuId: string): Promise<void> {
    try {
      const row = await this.mappings.findOneMapping(roleId, menuId);
      if (!row) {
        throw new HttpException(
          'Role menu mapping not found',
          HttpStatus.NOT_FOUND,
        );
      }
      await this.mappings.remove(row);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `RoleMenuMappingService.remove roleId=${roleId} menuId=${menuId}`,
        'Could not delete the role menu mapping',
      );
    }
  }
}
