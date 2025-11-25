import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CategoryType } from "../entities/category.entity";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCategoryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: CategoryType })
  @IsEnum(CategoryType)
  @IsNotEmpty()
  type: CategoryType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  icon?: string;
}

export class UpdateCategoryDto extends CreateCategoryDto {}
