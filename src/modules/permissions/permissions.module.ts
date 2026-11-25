import { Module } from '@nestjs/common';
import { MastersModule } from '../masters/masters.module';
import { PermissionCatalogController } from './controller/permission-catalog.controller';
import { PermissionsGuard } from './guards/permissions.guard';
import { AccessReadRepository } from './repository/access-read.repository';
import { PermissionCatalogService } from './service/permission-catalog.service';
import { PermissionsService } from './service/permissions.service';

@Module({
  imports: [MastersModule],
  controllers: [PermissionCatalogController],
  providers: [
    AccessReadRepository,
    PermissionsService,
    PermissionCatalogService,
    PermissionsGuard,
  ],
  exports: [PermissionsService, PermissionsGuard],
})
export class PermissionsModule {}
