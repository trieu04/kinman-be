import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { GetUserId } from "../../auth/decorators/get-user-id.decorator";
import { CategoriesService } from "../services/categories.service";
import { CreateCategoryDto, UpdateCategoryDto } from "../dtos/category.dto";

@ApiTags("Categories")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@GetUserId() userId: string, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(userId, dto);
  }

  @Get()
  findAll(@GetUserId() userId: string) {
    return this.categoriesService.findAll(userId);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @GetUserId() userId: string) {
    return this.categoriesService.findOne(id, userId);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @GetUserId() userId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, userId, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @GetUserId() userId: string) {
    return this.categoriesService.remove(id, userId);
  }
}
