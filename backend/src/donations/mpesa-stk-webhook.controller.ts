import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { DonationsService } from './donations.service';

@Controller('webhooks')
export class MpesaStkWebhookController {
  constructor(private readonly donations: DonationsService) {}

  @Post('mpesa/stk')
  async handle(@Body() body: unknown, @Res() res: Response) {
    await this.donations.handleMpesaStkCallback(body);
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}
