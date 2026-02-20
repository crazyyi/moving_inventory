import { IsNumber, Min } from 'class-validator';

export class UpdateQuantityDto {
  @IsNumber() @Min(0) quantity: number;
}
