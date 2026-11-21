import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export enum SortBy {
  RELEVANCE = 'relevance',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  RATING_DESC = 'rating_desc',
  POPULAR = 'popular',
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  CREATED_DESC = 'created_desc',
}

const toBoolean = ({ value }: { value: unknown }): boolean | undefined => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return undefined;
};

export const toNumber = ({ value }: { value: any }): number | undefined => {
  if (value === '' || value === null || value === undefined) return undefined;

  const num = Number(value);
  return isNaN(num) ? undefined : num;
};

export class SearchProductDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @Transform(toNumber)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(toNumber)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Transform(toNumber)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Transform(toNumber)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.RELEVANCE;
}
