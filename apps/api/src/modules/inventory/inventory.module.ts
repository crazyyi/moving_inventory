import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { DrizzleModule } from '@moving/drizzle.module';

@Module({
  imports: [DrizzleModule], // 👈 This gives this module access to the DB
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule { }
