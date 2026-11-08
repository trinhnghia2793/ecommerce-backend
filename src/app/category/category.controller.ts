import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ResEx } from 'src/swagger/response-examples';
import { RequireRoles } from 'src/core/decorators/roles-with-guard.decorator';
import { UserRole } from 'src/shared/types/user-role.enum';

@ApiTags('Category')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // create
  @Post()
  @ApiBearerAuth()
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create category', operationId: 'category_create' })
  @ApiOkResponse({
    description: 'Response example',
    schema: { example: ResEx.category.one },
  })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  // find all
  @Get()
  @ApiOperation({ summary: 'Category list', operationId: 'category_find_all' })
  @ApiOkResponse({
    description: 'Response example',
    schema: { example: ResEx.category.list },
  })
  findAll() {
    return this.categoryService.findAll();
  }

  // find one
  @Get(':id')
  @ApiOperation({
    summary: 'Category detail',
    operationId: 'category_find_one',
  })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
  })
  @ApiOkResponse({
    description: 'Response example',
    schema: { example: ResEx.category.detail },
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoryService.findOne(id);
  }

  // update
  @Patch(':id')
  @ApiBearerAuth()
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update category',
    operationId: 'category_update',
  })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
  })
  @ApiOkResponse({
    description: 'Response example',
    schema: { example: ResEx.category.one },
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, dto);
  }

  // delete (soft delete)
  @Delete(':id')
  @ApiBearerAuth()
  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete category',
    operationId: 'category_remove',
  })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
  })
  @ApiOkResponse({
    description: 'Response example',
    schema: { example: { success: true } },
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoryService.remove(id);
  }
}
