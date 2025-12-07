import { Module } from '@nestjs/common';
import { ReportsController } from './controllers/reports.controller';
import { ReportsService } from './services/reports.service';

@Module({
  imports: [],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
