import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { toNumber } from './search-product.dto';

export class SuggestProductDto {
  @IsString()
  query: string;

  @IsOptional()
  @Transform(toNumber)
  @IsNumber({}, { message: 'size must be a number' })
  @Min(1)
  @Max(10)
  size?: number = 5;
}
