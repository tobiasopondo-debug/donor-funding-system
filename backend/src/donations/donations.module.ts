import { Module } from '@nestjs/common';
import { MpesaModule } from '../mpesa/mpesa.module';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';
import { MpesaStkWebhookController } from './mpesa-stk-webhook.controller';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  imports: [MpesaModule],
  controllers: [DonationsController, StripeWebhookController, MpesaStkWebhookController],
  providers: [DonationsService],
  exports: [DonationsService],
})
export class DonationsModule {}
