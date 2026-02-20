import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
} from 'class-validator';

export class UpsertItemDto {
  @IsOptional() @IsString() itemLibraryId?: string;
  @IsString() name: string;
  @IsOptional() @IsString() category?: string;
  @IsNumber() @Min(1) quantity: number;
  @IsOptional() @IsNumber() cuFtPerItem?: number;
  @IsOptional() @IsNumber() weightPerItem?: number;
  @IsOptional() @IsBoolean() isSpecialtyItem?: boolean;
  @IsOptional() @IsBoolean() requiresDisassembly?: boolean;
  @IsOptional() @IsBoolean() isFragile?: boolean;
  @IsOptional() @IsBoolean() isHighValue?: boolean;
  @IsOptional() @IsArray() images?: string[];
  @IsOptional() @IsString() notes?: string;
}
