import { Controller, Get, Query, Inject } from '@nestjs/common'; // 1. Import Inject
import { ItemsService } from './items.service';

@Controller('item-library')
export class ItemLibraryController {
  // 2. Inject the service as a property
  @Inject(ItemsService)
  private readonly itemsService: ItemsService;

  // 3. Keep the constructor empty or remove it
  constructor() { }

  @Get()
  async search(
    @Query('q') query?: string,
    @Query('category') category?: string,
    @Query('roomType') roomType?: string,
  ) {
    // Now "this.itemsService" will be correctly defined
    const items = await this.itemsService.searchLibrary(
      query,
      category,
      roomType,
    );
    return { success: true, data: items, total: items.length };
  }

  @Get('categories')
  async getCategories() {
    // This was the line causing the crash
    const categories = await this.itemsService.getCategories();
    return { success: true, data: categories };
  }
}