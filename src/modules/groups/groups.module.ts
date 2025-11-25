import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "../../auth/entities/user.entity";
import { GroupsController } from "./controllers/groups.controller";
import { GroupsService } from "./services/groups.service";
import { GroupExpensesService } from "./services/group-expenses.service";
import { GroupEntity } from "./entities/group.entity";
import { GroupMemberEntity } from "./entities/group-member.entity";
import { GroupExpenseEntity } from "./entities/group-expense.entity";
import { SettlementEntity } from "./entities/settlement.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GroupEntity,
      GroupMemberEntity,
      GroupExpenseEntity,
      SettlementEntity,
      UserEntity,
    ]),
  ],
  controllers: [GroupsController],
  providers: [GroupsService, GroupExpensesService],
  exports: [GroupsService],
})
export class GroupsModule {}
