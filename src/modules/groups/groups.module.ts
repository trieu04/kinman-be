import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "../auth/entities/user.entity";
import { AuthModule } from "../auth/auth.module";
import { GroupsController } from "./controllers/groups.controller";
import { GroupExpenseEntity } from "./entities/group-expense.entity";
import { GroupMemberEntity } from "./entities/group-member.entity";
import { GroupEntity } from "./entities/group.entity";
import { SettlementEntity } from "./entities/settlement.entity";
import { GroupExpensesService } from "./services/group-expenses.service";
import { GroupsService } from "./services/groups.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GroupEntity,
      GroupMemberEntity,
      GroupExpenseEntity,
      SettlementEntity,
      UserEntity,
    ]),
    AuthModule,
  ],
  controllers: [GroupsController],
  providers: [GroupsService, GroupExpensesService],
  exports: [GroupsService],
})
export class GroupsModule {}
