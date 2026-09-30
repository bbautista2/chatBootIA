import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('messages-by-day')
  getMessagesByDay(@Query('days') days?: number) {
    return this.dashboardService.getMessagesByDay(days || 7);
  }

  @Get('messages-by-account')
  getMessagesByAccount() {
    return this.dashboardService.getMessagesByAccount();
  }

  @Get('conversations-by-status')
  getConversationsByStatus() {
    return this.dashboardService.getConversationsByStatus();
  }
}
