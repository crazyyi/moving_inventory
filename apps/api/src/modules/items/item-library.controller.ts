import { Controller, Get, Query } from '@nestjs/common';
import { ItemsService } from './items.service';

@Controller('item-library')
export class ItemLibraryController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  async search(
    @Query('q') query?: string,
    @Query('category') category?: string,
    @Query('roomType') roomType?: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const items = await this.itemsService.searchLibrary(
      query,
      category,
      roomType,
    );
    return { success: true, data: items, total: items.length };
  }

  @Get('categories')
  async getCategories() {
    const categories = await this.itemsService.getCategories();
    return { success: true, data: categories };
  }
}
