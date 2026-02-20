import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class UpdateRoomDto {
  @IsOptional() @IsString() customName?: string;
  @IsOptional() @IsBoolean() isComplete?: boolean;
  @IsOptional() @IsNumber() sortOrder?: number;
}
