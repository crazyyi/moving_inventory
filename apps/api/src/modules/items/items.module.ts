import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemLibraryController } from './item-library.controller';
import { ItemsService } from './items.service';
import { InventoryModule } from '../inventory/inventory.module';
import { DrizzleModule } from '@moving/drizzle.module';

@Module({
  imports: [InventoryModule, DrizzleModule], // 👈 This gives this module access to the DB and InventoryService
  controllers: [ItemsController, ItemLibraryController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule { }
