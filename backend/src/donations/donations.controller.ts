import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CheckoutDto,
  CheckoutVerifyDto,
  MpesaInitiateDto,
} from './dto/donation.dto';
import { DonationsService } from './donations.service';

@Controller('donations')
export class DonationsController {
  constructor(private readonly donations: DonationsService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.DONOR)
  listMine(@CurrentUser() user: AuthUser) {
    return this.donations.listMine(user.id);
  }

  @Post('checkout')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.DONOR)
  checkout(@CurrentUser() user: AuthUser, @Body() body: CheckoutDto) {
    return this.donations.createCheckout(
      user.id,
      user.role as UserRole,
      body.projectId,
      body.amountMinor,
    );
  }

  /** When Stripe webhooks are not forwarded (e.g. local Docker), finalize the session after redirect to /success. */
  @Post('checkout/verify-session')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.DONOR)
  verifyCheckout(
    @CurrentUser() user: AuthUser,
    @Body() body: CheckoutVerifyDto,
  ) {
    return this.donations.verifyCheckoutSession(user.id, body.sessionId);
  }

  @Post('mpesa/initiate')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.DONOR)
  initiateMpesa(@CurrentUser() user: AuthUser, @Body() body: MpesaInitiateDto) {
    return this.donations.initiateMpesaStk(
      user.id,
      user.role as UserRole,
      body,
    );
  }

  @Get('mpesa/status/:donationId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.DONOR)
  mpesaStatus(
    @CurrentUser() user: AuthUser,
    @Param('donationId') donationId: string,
  ) {
    return this.donations.refreshMpesaDonationStatus(user.id, donationId);
  }
}
