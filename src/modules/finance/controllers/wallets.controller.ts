import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { GetUserId } from "../../auth/decorators/get-user-id.decorator";
import { WalletsService } from "../services/wallets.service";
import { CreateWalletDto, UpdateWalletDto } from "../dtos/wallet.dto";

@ApiTags("Wallets")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("wallets")
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  create(@GetUserId() userId: string, @Body() dto: CreateWalletDto) {
    return this.walletsService.create(userId, dto);
  }

  @Get()
  findAll(@GetUserId() userId: string) {
    return this.walletsService.findAll(userId);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @GetUserId() userId: string) {
    return this.walletsService.findOne(id, userId);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @GetUserId() userId: string,
    @Body() dto: UpdateWalletDto,
  ) {
    return this.walletsService.update(id, userId, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @GetUserId() userId: string) {
    return this.walletsService.remove(id, userId);
  }
}
