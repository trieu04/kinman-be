import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateGroupDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class AddMemberDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  usernameOrEmail: string;
}
