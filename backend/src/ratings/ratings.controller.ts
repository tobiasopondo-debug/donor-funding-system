import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpsertRatingDto } from './dto/rating.dto';
import { RatingsService } from './ratings.service';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratings: RatingsService) {}

  @Get('public/:orgId')
  summary(@Param('orgId') orgId: string) {
    return this.ratings.summary(orgId);
  }

  @Post('me')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.DONOR)
  upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertRatingDto) {
    return this.ratings.upsert(user.id, user.role as UserRole, dto);
  }
}
