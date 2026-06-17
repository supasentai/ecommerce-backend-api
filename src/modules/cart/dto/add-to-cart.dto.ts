import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  quantity: number;
}
