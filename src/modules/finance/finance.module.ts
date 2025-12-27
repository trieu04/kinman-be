import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "../auth/auth.module";
import { UserEntity } from "../auth/entities/user.entity"; // Imported for Groups Feature

// Categories
import { CategoriesController } from "./controllers/categories.controller";
import { CategoryEntity } from "./entities/category.entity";
import { CategoriesService } from "./services/categories.service";

// Groups
import { GroupsController } from "./controllers/groups.controller";
import { GroupExpenseEntity } from "./entities/group-expense.entity";
import { GroupMemberEntity } from "./entities/group-member.entity";
import { GroupEntity } from "./entities/group.entity";
import { SettlementEntity } from "./entities/settlement.entity";
import { GroupExpensesService } from "./services/group-expenses.service";
import { GroupsService } from "./services/groups.service";

// Reports
import { ReportsController } from "./controllers/reports.controller";
import { ReportsService } from "./services/reports.service";

// Transactions
import { TransactionsController } from "./controllers/transactions.controller";
import { TransactionEntity } from "./entities/transaction.entity";
import { TransactionSplitEntity } from "./entities/transaction-split.entity";
import { TransactionsService } from "./services/transactions.service";

// Wallets
import { WalletsController } from "./controllers/wallets.controller";
import { WalletEntity } from "./entities/wallet.entity";
import { WalletsService } from "./services/wallets.service";

// Notifications
import { NotificationModule } from "../notification/notification.module";

// Realtime
import { RealtimeModule } from "../realtime/realtime.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CategoryEntity,
      GroupEntity,
      GroupMemberEntity,
      GroupExpenseEntity,
      SettlementEntity,
      TransactionEntity,
      TransactionSplitEntity,
      WalletEntity,
      UserEntity, // Necessary for Group relations if not provided globally or by other module context
    ]),
    AuthModule,
    NotificationModule,
    RealtimeModule,
  ],
  controllers: [
    CategoriesController,
    GroupsController,
    ReportsController,
    TransactionsController,
    WalletsController,
  ],
  providers: [
    CategoriesService,
    GroupsService,
    GroupExpensesService,
    ReportsService,
    TransactionsService,
    WalletsService,
  ],
  exports: [
    CategoriesService,
    GroupsService,
    TransactionsService,
    WalletsService,
  ],
})
export class FinanceModule {}
