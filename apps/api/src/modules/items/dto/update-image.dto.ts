import { IsArray, IsString } from 'class-validator';

export class UpdateImagesDto {
  @IsArray() @IsString({ each: true }) images: string[];
}
