import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('public')
  publicStats() {
    return this.reports.publicStats();
  }

  @Get('admin/donations-by-day')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  adminDonationsByDay() {
    return this.reports.adminDonationsByDay();
  }

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  admin() {
    return this.reports.adminDashboard();
  }

  @Get('ngo')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.NGO_USER)
  ngo(@CurrentUser() user: AuthUser) {
    return this.reports.ngoDashboard(user.id);
  }

  @Get('donor')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.DONOR)
  donor(@CurrentUser() user: AuthUser) {
    return this.reports.donorStats(user.id);
  }
}
