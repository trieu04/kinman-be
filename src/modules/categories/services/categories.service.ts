import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CategoryEntity } from "../entities/category.entity";
import { CreateCategoryDto, UpdateCategoryDto } from "../dtos/category.dto";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
  ) {}

  async create(userId: string, dto: CreateCategoryDto) {
    return this.categoryRepo.save({
      ...dto,
      user: { id: userId },
    });
  }

  async findAll(userId: string) {
    return this.categoryRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string, userId: string) {
    const category = await this.categoryRepo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!category) {
      throw new NotFoundException("Category not found");
    }
    return category;
  }

  async update(id: string, userId: string, dto: UpdateCategoryDto) {
    const category = await this.findOne(id, userId);
    return this.categoryRepo.save({
      ...category,
      ...dto,
    });
  }

  async remove(id: string, userId: string) {
    const category = await this.findOne(id, userId);
    return this.categoryRepo.softRemove(category);
  }
}
