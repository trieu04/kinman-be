import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { SplitType } from "../entities/group-expense.entity";

export class ExpenseSplitDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}

export class CreateGroupExpenseDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ enum: SplitType, default: SplitType.EQUAL })
  @IsEnum(SplitType)
  splitType: SplitType = SplitType.EQUAL;

  @ApiProperty({ type: [ExpenseSplitDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseSplitDto)
  splits?: ExpenseSplitDto[];

  @ApiProperty({ required: false, description: 'User ID who paid for this expense. Defaults to current user if not specified.' })
  @IsOptional()
  @IsUUID()
  paidBy?: string;
}
