import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Product } from '../product/entities/product.entity';
import { Not, Repository } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  // create: check slug exists, available parentId
  async create(dto: CreateCategoryDto) {
    const slugExists = await this.categoryRepository.findOne({
      where: { slug: dto.slug },
    });
    if (slugExists) {
      throw new ConflictException('Category slug existed');
    }

    if (dto.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new BadRequestException('Parent category does not exist');
      }
    }

    const category = this.categoryRepository.create(dto);
    return this.categoryRepository.save(category);
  }

  // find all
  findAll() {
    return this.categoryRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  // find one
  async findOne(id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: { children: true },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // update: check if exists, check slug, check parentId when change
  async update(id: string, dto: UpdateCategoryDto) {
    const exists = await this.categoryRepository.findOne({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Category not found');
    }

    if (dto.slug) {
      const dup = await this.categoryRepository.findOne({
        where: { slug: dto.slug, id: Not(id) },
      });
      if (dup) {
        throw new ConflictException('Category slug existed');
      }
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('Category cannot be parent itself');
      }

      const parent = await this.categoryRepository.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new BadRequestException('Parent category does not exist');
      }
    }

    await this.categoryRepository.update(id, dto);
    return this.findOne(id);
  }

  // remove (soft delete): check if exists, category has children, category has product
  async remove(id: string) {
    const exists = await this.categoryRepository.findOne({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Category not found');
    }

    const childCount = await this.categoryRepository.count({
      where: { parentId: id },
    });
    if (childCount > 0) {
      throw new ConflictException('Cannot delete category which has children');
    }

    const productCount = await this.productRepository.count({
      where: { categoryId: id },
    });
    if (productCount > 0) {
      throw new ConflictException('Cannot delete category which has product');
    }

    await this.categoryRepository.softDelete(id);
    return { success: true };
  }
}
