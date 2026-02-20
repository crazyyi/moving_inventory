import { Module } from '@nestjs/common';
import { GhlService } from './ghl.service';
import { GhlController } from './ghl.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { DrizzleModule } from '@moving/drizzle.module';

@Module({
  imports: [InventoryModule, DrizzleModule], // 👈 This gives this module access to the DB and InventoryService
  controllers: [GhlController],
  providers: [GhlService],
  exports: [GhlService],
})
export class GhlModule { }
