import { Module } from "@nestjs/common";

import { AuthModule } from "./modules/auth/auth.module";
import { AppConfigModule } from "./configs/app-config.module";
import { HealthModule } from "./modules/health/health.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { WalletsModule } from "./modules/wallets/wallets.module";
import { TransactionsModule } from "./modules/transactions/transactions.module";
import { GroupsModule } from "./modules/groups/groups.module";
import { AiModule } from "./modules/ai/ai.module";

@Module({
  imports: [
    AppConfigModule,
    AuthModule,
    HealthModule,
    CategoriesModule,
    WalletsModule,
    TransactionsModule,
    GroupsModule,
    AiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
