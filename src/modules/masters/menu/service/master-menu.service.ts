import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { rethrowServiceError } from '../../../../common/http/service-error';
import { CreateMasterMenuDto } from '../dto/request/create-master-menu.req.dto';
import { UpdateMasterMenuDto } from '../dto/request/update-master-menu.req.dto';
import { MasterMenuResponseDto } from '../dto/response/master-menu.res.dto';
import { toMasterMenuResponse } from '../mapper/master-menu.mapper';
import { MasterMenuRepository } from '../../menu/repository/master-menu.repository';

@Injectable()
export class MasterMenuService {
  private readonly logger = new Logger(MasterMenuService.name);

  constructor(private readonly menus: MasterMenuRepository) {}

  async list(includeInactive = false): Promise<MasterMenuResponseDto[]> {
    try {
      const rows = await this.menus.findAll(includeInactive);
      return rows.map(toMasterMenuResponse);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        'MasterMenuService.list',
        'Could not load master menus',
      );
    }
  }

  async getById(id: string): Promise<MasterMenuResponseDto> {
    try {
      const row = await this.requireById(id);
      return toMasterMenuResponse(row);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `MasterMenuService.getById id=${id}`,
        'Could not load the master menu',
      );
    }
  }

  async create(dto: CreateMasterMenuDto): Promise<MasterMenuResponseDto> {
    try {
      await this.assertCodeAvailable(dto.code);
      await this.assertParentExists(dto.parentId ?? null);
      const saved = await this.menus.save(
        this.menus.create({
          parentId: dto.parentId ?? null,
          code: dto.code,
          name: dto.name,
          route: dto.route ?? null,
          icon: dto.icon ?? null,
          scope: dto.scope,
          sortOrder: dto.sortOrder ?? 0,
          isActive: dto.isActive ?? true,
        }),
      );
      return toMasterMenuResponse(saved);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        'MasterMenuService.create',
        'Could not create the master menu',
      );
    }
  }

  async update(
    id: string,
    dto: UpdateMasterMenuDto,
  ): Promise<MasterMenuResponseDto> {
    try {
      const row = await this.requireById(id);
      if (dto.code !== undefined && dto.code !== row.code) {
        await this.assertCodeAvailable(dto.code);
        row.code = dto.code;
      }
      if (dto.parentId !== undefined) {
        if (dto.parentId === id) {
          throw new HttpException(
            'A menu cannot be its own parent',
            HttpStatus.BAD_REQUEST,
          );
        }
        await this.assertParentExists(dto.parentId);
        row.parentId = dto.parentId;
      }
      if (dto.name !== undefined) row.name = dto.name;
      if (dto.route !== undefined) row.route = dto.route;
      if (dto.icon !== undefined) row.icon = dto.icon;
      if (dto.scope !== undefined) row.scope = dto.scope;
      if (dto.sortOrder !== undefined) row.sortOrder = dto.sortOrder;
      if (dto.isActive !== undefined) row.isActive = dto.isActive;
      const saved = await this.menus.save(row);
      return toMasterMenuResponse(saved);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `MasterMenuService.update id=${id}`,
        'Could not update the master menu',
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const row = await this.requireById(id);
      await this.menus.softRemove(row);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `MasterMenuService.remove id=${id}`,
        'Could not delete the master menu',
      );
    }
  }

  private async requireById(id: string) {
    const row = await this.menus.findById(id);
    if (!row) {
      throw new HttpException('Master menu not found', HttpStatus.NOT_FOUND);
    }
    return row;
  }

  private async assertCodeAvailable(code: string): Promise<void> {
    const existing = await this.menus.findByCode(code);
    if (existing) {
      throw new HttpException(
        `Master menu code ${code} already exists`,
        HttpStatus.CONFLICT,
      );
    }
  }

  private async assertParentExists(parentId: string | null): Promise<void> {
    if (parentId === null) {
      return;
    }
    const parent = await this.menus.findById(parentId);
    if (!parent) {
      throw new HttpException(
        'Parent master menu not found',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
