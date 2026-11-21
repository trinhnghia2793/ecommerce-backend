import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductSearchService } from './product-search.service';
import { SearchProductDto } from './dto/search-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ResEx } from 'src/swagger/response-examples';
import { RequireRoles } from 'src/core/decorators/roles-with-guard.decorator';
import { UserRole } from 'src/shared/types/user-role.enum';
import { SuggestProductDto } from './dto/suggest-product.dto';

@ApiTags('Product')
@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly productSearchService: ProductSearchService,
  ) {}

  // create
  @Post()
  @ApiOperation({ summary: 'Create product', operationId: 'product_create' })
  @ApiBearerAuth()
  @ApiCreatedResponse({
    description: 'Create product successfully',
    schema: { example: ResEx.product.one },
  })
  @RequireRoles(UserRole.ADMIN)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  //
  @Get()
  findAll() {
    return this.productService.findAll();
  }

  // search products with criteria
  @Get('search')
  @ApiOperation({ summary: 'Search products', operationId: 'product_search' })
  @ApiOkResponse({
    description: 'Response example',
    schema: { example: ResEx.product.search },
  })
  async search(@Query() dto: SearchProductDto) {
    return this.productSearchService.searchProducts(dto.query, {
      page: dto.page,
      limit: dto.limit,
      categoryId: dto.categoryId,
      minPrice: dto.minPrice,
      maxPrice: dto.maxPrice,
      isActive: dto.isActive,
      sortBy: dto.sortBy,
    });
  }

  // search products when user typing on search
  @Get('suggest')
  @ApiOperation({
    summary: 'Suggest search keyword',
    operationId: 'product_suggest',
  })
  @ApiOkResponse({
    description: 'Response example',
    schema: { example: ResEx.product.suggest },
  })
  async suggest(@Query() dto: SuggestProductDto) {
    return this.productSearchService.suggest(dto.query, dto.size);
  }

  // get featured products
  @Get('featured')
  @ApiOperation({
    summary: 'Featured products',
    operationId: 'product_featured',
  })
  @ApiOkResponse({
    description: 'Response example',
    schema: { example: ResEx.product.list },
  })
  async getFeatured(@Query('limit') limit?: string) {
    const limitNum = Math.min(Math.max(parseInt(limit || '8', 10) || 8, 1), 20);
    return this.productSearchService.getFeatured(limitNum);
  }

  // get latest products for landing page
  @Get('landing')
  @ApiOperation({
    summary: 'Landing page products',
    operationId: 'product_landing',
  })
  @ApiOkResponse({
    description: 'Response example',
    schema: { example: ResEx.product.list },
  })
  async getLanding(@Query('limit') limit?: string) {
    const limitNum = Math.min(Math.max(parseInt(limit || '8', 10) || 8, 1), 20);
    return this.productSearchService.getLanding(limitNum);
  }

  // get product's prices & stock quantity
  @Get(':id/pricing')
  @ApiOperation({
    summary: "Product's prices & stock quantity",
    operationId: 'product_find_pricing',
  })
  @ApiOkResponse({
    description: 'Response example',
    schema: { example: ResEx.product.pricing },
  })
  findPricing(@Param('id', ParseUUIDPipe) id: string) {
    return this.productSearchService.findPricing(id);
  }

  // find one product
  @Get(':id')
  @ApiOperation({ summary: 'Product detail', operationId: 'product_find_one' })
  @ApiOkResponse({
    description: 'Response example',
    schema: { example: ResEx.product.one },
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const product = await this.productService.findOne(id);
    void this.productService.incrementView(id);
    return product;
  }

  // update
  @Patch(':id')
  @ApiOperation({
    summary: 'Update product',
    operationId: 'product_update',
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Response example',
    schema: { example: ResEx.product.one },
  })
  @RequireRoles(UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(id, dto);
  }

  // delete (soft delete)
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete product',
    operationId: 'product_remove',
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Response example',
    schema: { example: { success: true } },
  })
  @RequireRoles(UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.remove(id);
  }
}
