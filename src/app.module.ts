import { Module } from "@nestjs/common";

import { AuthModule } from "./modules/auth/auth.module";
import { AppConfigModule } from "./configs/app-config.module";
import { HealthModule } from "./modules/health/health.module";
import { FinanceModule } from "./modules/finance/finance.module";
import { AiModule } from "./modules/ai/ai.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";

@Module({
  imports: [
    AppConfigModule,
    AuthModule,
    HealthModule,
    AiModule,
    ReportsModule,
    RealtimeModule,
    FinanceModule,
    NotificationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
