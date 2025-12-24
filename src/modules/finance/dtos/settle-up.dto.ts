import { IsNotEmpty, IsNumber, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SettleUpDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  fromUserId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  toUserId: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
