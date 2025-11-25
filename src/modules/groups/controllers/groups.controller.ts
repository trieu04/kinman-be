import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { GetUserId } from "../../auth/decorators/get-user-id.decorator";
import { GroupsService } from "../services/groups.service";
import { GroupExpensesService } from "../services/group-expenses.service";
import { AddMemberDto, CreateGroupDto } from "../dtos/group.dto";
import { CreateGroupExpenseDto } from "../dtos/group-expense.dto";
import { SettleUpDto } from "../dtos/settle-up.dto";

@ApiTags("Groups")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("groups")
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly groupExpensesService: GroupExpensesService,
  ) {}

  @Post()
  create(@GetUserId() userId: string, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(userId, dto);
  }

  @Get()
  findAll(@GetUserId() userId: string) {
    return this.groupsService.findAll(userId);
  }

  @Post("join")
  joinByCode(@GetUserId() userId: string, @Body("code") code: string) {
    return this.groupsService.joinByCode(userId, code);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @GetUserId() userId: string) {
    return this.groupsService.findOne(id, userId);
  }

  @Post(":id/members")
  addMember(
    @Param("id") id: string,
    @GetUserId() userId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.groupsService.addMember(userId, id, dto);
  }

  @Post(":id/expenses")
  addExpense(
    @Param("id") id: string,
    @GetUserId() userId: string,
    @Body() dto: CreateGroupExpenseDto,
  ) {
    return this.groupExpensesService.addExpense(userId, id, dto);
  }

  @Get(":id/expenses")
  getExpenses(@Param("id") id: string, @GetUserId() userId: string) {
    return this.groupExpensesService.getExpenses(userId, id);
  }

  @Get(":id/debts")
  getDebts(@Param("id") id: string, @GetUserId() userId: string) {
    return this.groupExpensesService.getDebts(userId, id);
  }

  @Post(":id/settle-up")
  settleUp(
    @Param("id") id: string,
    @GetUserId() userId: string,
    @Body() dto: SettleUpDto,
  ) {
    return this.groupExpensesService.settleUp(userId, id, dto);
  }
}
