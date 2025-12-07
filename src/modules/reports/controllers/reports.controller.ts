import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('category-breakdown')
  async getCategoryBreakdown(
    @Req() req: any,
    @Query('year') year: string, // Accept as string from Query
    @Query('month') month?: string,
  ) {
    const yearNum = year ? parseInt(year, 10) : new Date().getFullYear();
    const monthNum = month ? parseInt(month, 10) : undefined;
    return this.reportsService.getCategoryBreakdown(req.user.id, yearNum, monthNum);
  }

  @Get('monthly-trend')
  async getMonthlyTrend(
    @Req() req: any,
    @Query('year') year: string,
  ) {
    const yearNum = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.reportsService.getMonthlyTrend(req.user.id, yearNum);
  }
}
