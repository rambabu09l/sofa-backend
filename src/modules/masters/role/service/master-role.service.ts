import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { rethrowServiceError } from '../../../../common/http/service-error';
import { CreateMasterRoleDto } from '../dto/request/create-master-role.req.dto';
import { UpdateMasterRoleDto } from '../dto/request/update-master-role.req.dto';
import { MasterRoleResponseDto } from '../dto/response/master-role.res.dto';
import { MasterRoleCode } from '../enum/master-role.enums';
import { toMasterRoleResponse } from '../mapper/master-role.mapper';
import { MasterRoleRepository } from '../../role/repository/master-role.repository';

@Injectable()
export class MasterRoleService {
  private readonly logger = new Logger(MasterRoleService.name);

  constructor(private readonly roles: MasterRoleRepository) {}

  async list(includeInactive = false): Promise<MasterRoleResponseDto[]> {
    try {
      const rows = await this.roles.findAll(includeInactive);
      return rows.map(toMasterRoleResponse);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        'MasterRoleService.list',
        'Could not load master roles',
      );
    }
  }

  async getById(id: string): Promise<MasterRoleResponseDto> {
    try {
      const row = await this.requireById(id);
      return toMasterRoleResponse(row);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `MasterRoleService.getById id=${id}`,
        'Could not load the master role',
      );
    }
  }

  async create(dto: CreateMasterRoleDto): Promise<MasterRoleResponseDto> {
    try {
      await this.assertCodeAvailable(dto.code);
      const saved = await this.roles.save(
        this.roles.create({
          code: dto.code,
          name: dto.name,
          scope: dto.scope,
          description: dto.description ?? null,
          isSystem: dto.isSystem ?? false,
          isAssignable: dto.isAssignable ?? true,
          isActive: dto.isActive ?? true,
        }),
      );
      return toMasterRoleResponse(saved);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        'MasterRoleService.create',
        'Could not create the master role',
      );
    }
  }

  async update(
    id: string,
    dto: UpdateMasterRoleDto,
  ): Promise<MasterRoleResponseDto> {
    try {
      const row = await this.requireById(id);
      if (dto.code !== undefined && dto.code !== row.code) {
        await this.assertCodeAvailable(dto.code);
        row.code = dto.code;
      }
      if (dto.name !== undefined) row.name = dto.name;
      if (dto.scope !== undefined) row.scope = dto.scope;
      if (dto.description !== undefined) row.description = dto.description;
      if (dto.isSystem !== undefined) row.isSystem = dto.isSystem;
      if (dto.isAssignable !== undefined) row.isAssignable = dto.isAssignable;
      if (dto.isActive !== undefined) row.isActive = dto.isActive;
      const saved = await this.roles.save(row);
      return toMasterRoleResponse(saved);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `MasterRoleService.update id=${id}`,
        'Could not update the master role',
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const row = await this.requireById(id);
      await this.roles.softRemove(row);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `MasterRoleService.remove id=${id}`,
        'Could not delete the master role',
      );
    }
  }

  async requireIdByCode(code: MasterRoleCode): Promise<string> {
    const role = await this.roles.findByCode(code);
    if (!role || !role.isActive) {
      throw new HttpException(
        `Master role ${code} is not configured`,
        HttpStatus.NOT_FOUND,
      );
    }
    return role.id;
  }

  private async requireById(id: string) {
    const row = await this.roles.findById(id);
    if (!row) {
      throw new HttpException('Master role not found', HttpStatus.NOT_FOUND);
    }
    return row;
  }

  private async assertCodeAvailable(code: string): Promise<void> {
    const existing = await this.roles.findByCode(code);
    if (existing) {
      throw new HttpException(
        `Master role code ${code} already exists`,
        HttpStatus.CONFLICT,
      );
    }
  }
}
