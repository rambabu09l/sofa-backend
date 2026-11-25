import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { rethrowServiceError } from '../../../../common/http/service-error';
import { CreateMasterPermissionDto } from '../dto/request/create-master-permission.req.dto';
import { UpdateMasterPermissionDto } from '../dto/request/update-master-permission.req.dto';
import { MasterPermissionResponseDto } from '../dto/response/master-permission.res.dto';
import { toMasterPermissionResponse } from '../mapper/master-permission.mapper';
import { MasterPermissionRepository } from '../../permission/repository/master-permission.repository';

@Injectable()
export class MasterPermissionService {
  private readonly logger = new Logger(MasterPermissionService.name);

  constructor(private readonly permissions: MasterPermissionRepository) {}

  async list(includeInactive = false): Promise<MasterPermissionResponseDto[]> {
    try {
      const rows = await this.permissions.findAll(includeInactive);
      return rows.map(toMasterPermissionResponse);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        'MasterPermissionService.list',
        'Could not load master permissions',
      );
    }
  }

  async getById(id: string): Promise<MasterPermissionResponseDto> {
    try {
      const row = await this.requireById(id);
      return toMasterPermissionResponse(row);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `MasterPermissionService.getById id=${id}`,
        'Could not load the master permission',
      );
    }
  }

  async create(
    dto: CreateMasterPermissionDto,
  ): Promise<MasterPermissionResponseDto> {
    try {
      await this.assertCodeAvailable(dto.code);
      const saved = await this.permissions.save(
        this.permissions.create({
          code: dto.code,
          name: dto.name,
          category: dto.category,
          scope: dto.scope,
          description: dto.description ?? null,
          sortOrder: dto.sortOrder ?? 0,
          isActive: dto.isActive ?? true,
        }),
      );
      return toMasterPermissionResponse(saved);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        'MasterPermissionService.create',
        'Could not create the master permission',
      );
    }
  }

  async update(
    id: string,
    dto: UpdateMasterPermissionDto,
  ): Promise<MasterPermissionResponseDto> {
    try {
      const row = await this.requireById(id);
      if (dto.code !== undefined && dto.code !== row.code) {
        await this.assertCodeAvailable(dto.code);
        row.code = dto.code;
      }
      if (dto.name !== undefined) row.name = dto.name;
      if (dto.category !== undefined) row.category = dto.category;
      if (dto.scope !== undefined) row.scope = dto.scope;
      if (dto.description !== undefined) row.description = dto.description;
      if (dto.sortOrder !== undefined) row.sortOrder = dto.sortOrder;
      if (dto.isActive !== undefined) row.isActive = dto.isActive;
      const saved = await this.permissions.save(row);
      return toMasterPermissionResponse(saved);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `MasterPermissionService.update id=${id}`,
        'Could not update the master permission',
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const row = await this.requireById(id);
      await this.permissions.softRemove(row);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `MasterPermissionService.remove id=${id}`,
        'Could not delete the master permission',
      );
    }
  }

  private async requireById(id: string) {
    const row = await this.permissions.findById(id);
    if (!row) {
      throw new HttpException(
        'Master permission not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return row;
  }

  private async assertCodeAvailable(code: string): Promise<void> {
    const existing = await this.permissions.findByCode(code);
    if (existing) {
      throw new HttpException(
        `Master permission code ${code} already exists`,
        HttpStatus.CONFLICT,
      );
    }
  }
}
