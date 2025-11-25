import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateTransactionDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  walletId: string;
}

export class UpdateTransactionDto extends CreateTransactionDto {}

export class TransactionFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  walletId?: string;
}
