import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { WalletType } from "../entities/wallet.entity";
import { ApiProperty } from "@nestjs/swagger";

export class CreateWalletDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: WalletType })
  @IsEnum(WalletType)
  @IsOptional()
  type?: WalletType;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  balance: number;

  @ApiProperty({ required: false, default: "VND" })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class UpdateWalletDto extends CreateWalletDto {}
