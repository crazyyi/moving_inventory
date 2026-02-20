import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Added this
import { ThrottlerModule } from '@nestjs/throttler';
import { InventoryModule } from './modules/inventory/inventory.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { ItemsModule } from './modules/items/items.module';
import { AdminModule } from './modules/admin/admin.module';
import { GhlModule } from './modules/ghl/ghl.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    // --- Modern Env Loading ---
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
      ],
    }),
    // --------------------------
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    InventoryModule,
    RoomsModule,
    ItemsModule,
    AdminModule,
    GhlModule,
    UploadModule,
  ],
})
export class AppModule { }