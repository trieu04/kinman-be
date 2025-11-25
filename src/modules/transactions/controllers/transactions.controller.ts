import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { GetUserId } from "../../auth/decorators/get-user-id.decorator";
import { TransactionsService } from "../services/transactions.service";
import { CreateTransactionDto, TransactionFilterDto, UpdateTransactionDto } from "../dtos/transaction.dto";

@ApiTags("Transactions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@GetUserId() userId: string, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(userId, dto);
  }

  @Get()
  findAll(@GetUserId() userId: string, @Query() filter: TransactionFilterDto) {
    return this.transactionsService.findAll(userId, filter);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @GetUserId() userId: string) {
    return this.transactionsService.findOne(id, userId);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @GetUserId() userId: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, userId, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @GetUserId() userId: string) {
    return this.transactionsService.remove(id, userId);
  }
}
