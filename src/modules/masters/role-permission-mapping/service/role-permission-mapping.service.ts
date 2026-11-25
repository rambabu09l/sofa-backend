import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { rethrowServiceError } from '../../../../common/http/service-error';
import { CreateRolePermissionMappingDto } from '../dto/request/create-role-permission-mapping.req.dto';
import { RolePermissionMappingResponseDto } from '../dto/response/role-permission-mapping.res.dto';
import { toRolePermissionMappingResponse } from '../mapper/role-permission-mapping.mapper';
import { MasterPermissionRepository } from '../../permission/repository/master-permission.repository';
import { MasterRoleRepository } from '../../role/repository/master-role.repository';
import { RolePermissionMappingRepository } from '../repository/role-permission-mapping.repository';

@Injectable()
export class RolePermissionMappingService {
  private readonly logger = new Logger(RolePermissionMappingService.name);

  constructor(
    private readonly mappings: RolePermissionMappingRepository,
    private readonly roles: MasterRoleRepository,
    private readonly permissions: MasterPermissionRepository,
  ) {}

  async list(roleId?: string): Promise<RolePermissionMappingResponseDto[]> {
    try {
      const rows = roleId
        ? await this.mappings.findByRoleId(roleId)
        : await this.mappings.findAll();
      return rows.map(toRolePermissionMappingResponse);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        'RolePermissionMappingService.list',
        'Could not load role permission mappings',
      );
    }
  }

  async get(
    roleId: string,
    permissionId: string,
  ): Promise<RolePermissionMappingResponseDto> {
    try {
      const row = await this.mappings.findOneMapping(roleId, permissionId);
      if (!row) {
        throw new HttpException(
          'Role permission mapping not found',
          HttpStatus.NOT_FOUND,
        );
      }
      return toRolePermissionMappingResponse(row);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `RolePermissionMappingService.get roleId=${roleId} permissionId=${permissionId}`,
        'Could not load the role permission mapping',
      );
    }
  }

  async create(
    dto: CreateRolePermissionMappingDto,
  ): Promise<RolePermissionMappingResponseDto> {
    try {
      const role = await this.roles.findById(dto.roleId);
      if (!role) {
        throw new HttpException('Master role not found', HttpStatus.NOT_FOUND);
      }
      const permission = await this.permissions.findById(dto.permissionId);
      if (!permission) {
        throw new HttpException(
          'Master permission not found',
          HttpStatus.NOT_FOUND,
        );
      }
      if (String(role.scope) !== String(permission.scope)) {
        throw new HttpException(
          'Permission scope must match the master role scope',
          HttpStatus.BAD_REQUEST,
        );
      }
      const existing = await this.mappings.findOneMapping(
        dto.roleId,
        dto.permissionId,
      );
      if (existing) {
        throw new HttpException(
          'Role permission mapping already exists',
          HttpStatus.CONFLICT,
        );
      }
      const saved = await this.mappings.save(
        this.mappings.create({
          roleId: dto.roleId,
          permissionId: dto.permissionId,
          scope: permission.scope,
        }),
      );
      return toRolePermissionMappingResponse(saved);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        'RolePermissionMappingService.create',
        'Could not create the role permission mapping',
      );
    }
  }

  async remove(roleId: string, permissionId: string): Promise<void> {
    try {
      const row = await this.mappings.findOneMapping(roleId, permissionId);
      if (!row) {
        throw new HttpException(
          'Role permission mapping not found',
          HttpStatus.NOT_FOUND,
        );
      }
      await this.mappings.remove(row);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `RolePermissionMappingService.remove roleId=${roleId} permissionId=${permissionId}`,
        'Could not delete the role permission mapping',
      );
    }
  }
}
