import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { InventoryModule } from '../inventory/inventory.module';
import { GhlModule } from '../ghl/ghl.module';
import { DrizzleModule } from '@moving/drizzle.module';

@Module({
  imports: [InventoryModule, GhlModule, DrizzleModule], // 👈 This gives this module access to the DB, InventoryService, and GhlService
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule { }
