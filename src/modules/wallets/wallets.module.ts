import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WalletEntity } from "./entities/wallet.entity";
import { AuthModule } from "../auth/auth.module";

import { WalletsController } from "./controllers/wallets.controller";
import { WalletsService } from "./services/wallets.service";

@Module({
  imports: [TypeOrmModule.forFeature([WalletEntity]), AuthModule],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
