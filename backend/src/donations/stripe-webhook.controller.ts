import { Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { DonationsService } from './donations.service';

@Controller('webhooks')
export class StripeWebhookController {
  constructor(private readonly donations: DonationsService) {}

  @Post('stripe')
  async handle(@Req() req: Request, @Res() res: Response) {
    const raw = req.body as Buffer;
    const sig = req.headers['stripe-signature'];
    const result = await this.donations.handleStripeEvent(raw, sig);
    return res.json(result);
  }
}
