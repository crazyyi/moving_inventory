import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateInventoryDto {
  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsEmail() customerEmail?: string;
  @IsOptional() @IsString() customerPhone?: string;
  @IsOptional() @IsString() moveDate?: string; // ISO date string
  @IsOptional() @IsString() fromAddress?: string;
  @IsOptional() @IsString() toAddress?: string;
  @IsOptional() @IsString() notes?: string;
}
