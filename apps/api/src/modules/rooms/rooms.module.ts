// rooms.module.ts
import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { InventoryModule } from '../inventory/inventory.module';
import { DrizzleModule } from '@moving/drizzle.module';

@Module({
  imports: [InventoryModule, DrizzleModule], // 👈 This gives this module access to the DB and InventoryService
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule { }
