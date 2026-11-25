import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterMenuController } from './menu/controller/master-menu.controller';
import { MasterMenuEntity } from './menu/entity/master-menu.entity';
import { MasterMenuRepository } from './menu/repository/master-menu.repository';
import { MasterMenuService } from './menu/service/master-menu.service';
import { MasterPermissionController } from './permission/controller/master-permission.controller';
import { MasterPermissionEntity } from './permission/entity/master-permission.entity';
import { MasterPermissionRepository } from './permission/repository/master-permission.repository';
import { MasterPermissionService } from './permission/service/master-permission.service';
import { MasterRoleController } from './role/controller/master-role.controller';
import { MasterRoleEntity } from './role/entity/master-role.entity';
import { MasterRoleRepository } from './role/repository/master-role.repository';
import { MasterRoleService } from './role/service/master-role.service';
import { RoleMenuMappingController } from './role-menu-mapping/controller/role-menu-mapping.controller';
import { RoleMenuMappingEntity } from './role-menu-mapping/entity/role-menu-mapping.entity';
import { RoleMenuMappingRepository } from './role-menu-mapping/repository/role-menu-mapping.repository';
import { RoleMenuMappingService } from './role-menu-mapping/service/role-menu-mapping.service';
import { RolePermissionMappingController } from './role-permission-mapping/controller/role-permission-mapping.controller';
import { RolePermissionMappingEntity } from './role-permission-mapping/entity/role-permission-mapping.entity';
import { RolePermissionMappingRepository } from './role-permission-mapping/repository/role-permission-mapping.repository';
import { RolePermissionMappingService } from './role-permission-mapping/service/role-permission-mapping.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MasterRoleEntity,
      MasterPermissionEntity,
      MasterMenuEntity,
      RolePermissionMappingEntity,
      RoleMenuMappingEntity,
    ]),
  ],
  controllers: [
    MasterRoleController,
    MasterPermissionController,
    MasterMenuController,
    RolePermissionMappingController,
    RoleMenuMappingController,
  ],
  providers: [
    MasterRoleRepository,
    MasterPermissionRepository,
    MasterMenuRepository,
    RolePermissionMappingRepository,
    RoleMenuMappingRepository,
    MasterRoleService,
    MasterPermissionService,
    MasterMenuService,
    RolePermissionMappingService,
    RoleMenuMappingService,
  ],
  exports: [
    MasterRoleRepository,
    MasterPermissionRepository,
    MasterMenuRepository,
    MasterRoleService,
    MasterPermissionService,
    MasterMenuService,
    RolePermissionMappingService,
    RoleMenuMappingService,
  ],
})
export class MastersModule {}
