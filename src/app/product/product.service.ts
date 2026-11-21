import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Not, Repository } from 'typeorm';
import { Category } from '../category/entities/category.entity';
import {
  apiBadRequest,
  apiConflict,
  apiNotFound,
} from 'src/shared/helpers/api-i18n';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProductService.name);
  }

  // create: check slug, sku (unique), available category
  async create(dto: CreateProductDto) {
    const slugExists = await this.productRepository.findOne({
      where: { slug: dto.slug },
    });
    if (slugExists) {
      throw new ConflictException('Product slug existed');
    }

    const skuExists = await this.productRepository.findOne({
      where: { sku: dto.sku },
    });
    if (skuExists) {
      throw new ConflictException('Product sku existed');
    }

    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new BadRequestException('Category does not exist');
    }

    const product = this.productRepository.create(dto);
    const saved = await this.productRepository.save(product);
    return this.findOne(saved.id);
  }

  //
  findAll() {
    return `This action returns all product`;
  }

  // find one
  async findOne(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!product) apiNotFound('Product not found');

    return product;
  }

  // helper: increment view for product
  async incrementView(id: string) {
    try {
      await this.productRepository.increment({ id }, 'viewCount', 1);
    } catch (error) {
      this.logger.error({
        msg: 'product.view.increment_failed',
        id,
        err: error as Error,
      });
    }
  }

  // update a product: check slug, sku, category id
  async update(id: string, dto: UpdateProductDto) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) apiNotFound('Product not found');

    if (dto.slug) {
      const dup = await this.productRepository.findOne({
        where: { slug: dto.slug, id: Not(id) },
      });
      if (dup) apiConflict('Product slug existed');
    }

    if (dto.sku) {
      const dup = await this.productRepository.findOne({
        where: { sku: dto.sku, id: Not(id) },
      });
      if (dup) apiConflict('Product sku existed');
    }

    if (dto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) apiBadRequest('Product category not existed');
    }

    await this.productRepository.update(id, dto);
    return this.findOne(id);
  }

  // remove (soft delete)
  async remove(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) apiNotFound('Product not found');

    await this.productRepository.softDelete(id);
    return { success: true };
  }
}
