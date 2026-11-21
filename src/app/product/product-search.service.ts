import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SortBy } from './dto/search-product.dto';
import { PinoLogger } from 'nestjs-pino';
import { apiNotFound } from 'src/shared/helpers/api-i18n';

export interface ProductSearchBody {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  sku: string;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  categoryName: string;
  ratingAverage: number;
  reviewCount: number;
  viewCount: number;
}

export interface SearchResult {
  products: ProductSearchBody[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ProductSearchService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProductSearchService.name);
  }

  // helper: order products
  private applySorting(
    queryBuilder: SelectQueryBuilder<Product>,
    sortBy: SortBy,
    query?: string,
  ): void {
    switch (sortBy) {
      case SortBy.PRICE_ASC:
        queryBuilder.orderBy('product.price', 'ASC');
        break;
      case SortBy.PRICE_DESC:
        queryBuilder.orderBy('product.price', 'DESC');
        break;
      case SortBy.RATING_DESC:
        queryBuilder.orderBy('product.ratingAverage', 'DESC');
        break;
      case SortBy.POPULAR:
        queryBuilder
          .orderBy('product.viewCount', 'DESC')
          .addOrderBy('product.createdAt', 'DESC');
        break;
      case SortBy.NAME_ASC:
        queryBuilder.orderBy('product.name', 'ASC');
        break;
      case SortBy.NAME_DESC:
        queryBuilder.orderBy('product.name', 'DESC');
        break;
      case SortBy.CREATED_DESC:
        queryBuilder.orderBy('product.createdAt', 'DESC');
        break;
      case SortBy.RELEVANCE:
        if (query && query.trim()) {
          const normalizedQuery = query.trim().toLowerCase();
          queryBuilder
            .addSelect(
              `CASE
                WHEN LOWER(product.name) = LOWER(:exactQuery) THEN 1
                WHEN LOWER(product.name) LIKE :startQuery THEN 2
                WHEN LOWER(product.sku) = LOWER(:exactQuery) THEN 3
                WHEN LOWER(category.name) = LOWER(:exactQuery) THEN 4
                WHEN LOWER(product.shortDescription) LIKE :startQuery THEN 5
                ELSE 6
              END`,
              'relevance_score',
            )
            .setParameter('exactQuery', normalizedQuery)
            .setParameter('startQuery', `${normalizedQuery}%`)
            .orderBy('relevance_score', 'ASC')
            .addOrderBy('product.name', 'ASC');
        } else {
          queryBuilder.orderBy('product.createdAt', 'DESC');
        }
        break;
    }
  }

  // helper: convert Product entity into ProductSearchBody
  private transformToSearchBody(products: Product[]): ProductSearchBody[] {
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription ?? '',
      description: product.description ?? '',
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      stockQuantity: product.stockQuantity,
      sku: product.sku,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      categoryId: product.categoryId,
      categoryName: product.category?.name ?? '',
      ratingAverage: product.ratingAverage,
      reviewCount: product.reviewCount,
      viewCount: product.viewCount,
    }));
  }

  // search product based on criteria: call order helper before get total & products list
  async searchProducts(
    query: string | undefined,
    options: {
      page?: number;
      limit?: number;
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
      isActive?: boolean;
      sortBy?: SortBy;
    } = {},
  ): Promise<SearchResult> {
    const {
      page = 1,
      limit = 20,
      categoryId,
      minPrice,
      maxPrice,
      isActive = true,
      sortBy = SortBy.RELEVANCE,
    } = options;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (query && query.trim()) {
      const searchTerm = `%${query.trim().toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(product.name) LIKE :searchTerm OR ' +
          'LOWER(product.shortDescription) LIKE :searchTerm OR ' +
          'LOWER(product.description) LIKE :searchTerm OR ' +
          'LOWER(product.sku) LIKE :searchTerm OR ' +
          'LOWER(category.name) LIKE :searchTerm)',
        { searchTerm },
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', { isActive });
    }

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    // order
    this.applySorting(queryBuilder, sortBy, query);

    const offset = (page - 1) * limit;
    const total = await queryBuilder.getCount();

    queryBuilder.skip(offset).take(limit);

    const products = await queryBuilder.getMany();
    return {
      products: this.transformToSearchBody(products),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // get suggest products when user search
  async suggest(
    query: string,
    size: number = 5,
  ): Promise<Array<{ name: string; slug: string }>> {
    try {
      if (!query || !query.trim()) {
        return [];
      }

      const searchTerm = `${query.trim().toLowerCase()}%`;

      const products = await this.productRepository
        .createQueryBuilder('product')
        .select(['product.name', 'product.slug'])
        .where('product.isActive = :isActive', { isActive: true })
        .andWhere('LOWER(product.name) LIKE :searchTerm', { searchTerm })
        .orderBy('product.viewCount', 'DESC')
        .addOrderBy('product.name', 'ASC')
        .limit(size)
        .getMany();

      return products.map((product) => ({
        name: product.name,
        slug: product.slug,
      }));
    } catch (error) {
      this.logger.error({
        msg: 'product.suggest.failed',
        query,
        err: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  // get featured products (products that marked 'featured' field = true)
  async getFeatured(limit = 8): Promise<ProductSearchBody[]> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.isFeatured = :featured', { featured: true })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .orderBy('product.createdAt', 'DESC') // get latest products first
      .take(limit)
      .getMany();

    return this.transformToSearchBody(products);
  }

  // get latest products for landing page
  async getLanding(limit = 8): Promise<ProductSearchBody[]> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.isActive = :isActive', { isActive: true })
      .orderBy('product.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return this.transformToSearchBody(products);
  }

  // get a product's prices & stock quantity
  async findPricing(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      select: {
        id: true,
        price: true,
        compareAtPrice: true,
        stockQuantity: true,
      },
    });
    if (!product) {
      apiNotFound('Product not found');
    }

    return {
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stockQuantity: product.stockQuantity,
    };
  }
}
