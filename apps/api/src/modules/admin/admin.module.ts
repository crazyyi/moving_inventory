import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { GhlModule } from '../ghl/ghl.module';
import { DrizzleModule } from '@moving/drizzle.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [GhlModule, DrizzleModule, InventoryModule], // 👈 This gives this module access to the DB, InventoryService, and GhlService
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule { }
