import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DonationStatus, OrganizationStatus, ProjectStatus, UserRole } from '@prisma/client';
import Stripe from 'stripe';
import { MpesaService } from '../mpesa/mpesa.service';
import { PrismaService } from '../prisma/prisma.service';
import { MpesaInitiateDto } from './dto/donation.dto';

@Injectable()
export class DonationsService {
  private stripeClient: Stripe | null = null;
  private readonly logger = new Logger(DonationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mpesa: MpesaService,
  ) {}

  /** Stripe is optional at process start; configure STRIPE_SECRET_KEY before card checkout. */
  private getStripe(): Stripe {
    const key = this.config.get<string>('STRIPE_SECRET_KEY')?.trim();
    if (!key) {
      throw new BadRequestException(
        'Stripe is not configured. Add STRIPE_SECRET_KEY (Dashboard → Developers → API keys, sk_test_… or sk_live_…) to the API environment and restart.',
      );
    }
    if (!this.stripeClient) {
      this.stripeClient = new Stripe(key);
    }
    return this.stripeClient;
  }

  async listMine(donorId: string) {
    return this.prisma.donation.findMany({
      where: { donorUserId: donorId },
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            organization: { select: { id: true, displayName: true } },
          },
        },
      },
    });
  }

  async createCheckout(donorId: string, role: UserRole, projectId: string, amountMinor: number) {
    if (role !== UserRole.DONOR) throw new BadRequestException('Only donors can donate');
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        status: ProjectStatus.PUBLISHED,
        organization: { status: OrganizationStatus.APPROVED },
      },
      include: { organization: true },
    });
    if (!project) throw new NotFoundException();
    const currency = project.currency.toLowerCase();
    const publicUrl = this.config.getOrThrow('PUBLIC_WEB_URL');
    const stripe = this.getStripe();
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: amountMinor,
              product_data: {
                name: project.title,
                description: project.summary.slice(0, 500),
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${publicUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${publicUrl}/cancel?project_id=${encodeURIComponent(projectId)}`,
        metadata: {
          projectId: project.id,
          donorUserId: donorId,
        },
        payment_intent_data: {
          metadata: {
            projectId: project.id,
            donorUserId: donorId,
          },
        },
      } as Stripe.Checkout.SessionCreateParams,
    );
    await this.prisma.donation.create({
      data: {
        donorUserId: donorId,
        projectId: project.id,
        amountMinor,
        currency: project.currency,
        status: DonationStatus.PENDING,
        stripeCheckoutSessionId: session.id,
      },
    });
    return { url: session.url, sessionId: session.id };
  }

  /**
   * After Checkout redirect (when webhooks are not delivered), confirm payment with Stripe and
   * mark the donation SUCCEEDED + increment project raised amount (idempotent).
   */
  async verifyCheckoutSession(donorId: string, sessionId: string) {
    const stripe = this.getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });
    if (session.payment_status !== 'paid') {
      return { ok: false as const, reason: 'not_paid' };
    }
    if (session.metadata?.donorUserId !== donorId) {
      throw new ForbiddenException();
    }
    const { updated } = await this.finalizeCheckoutSessionIfNeeded(session);
    return { ok: true as const, updated };
  }

  /** Idempotent: safe if webhook already ran. */
  private async finalizeCheckoutSessionIfNeeded(session: Stripe.Checkout.Session): Promise<{ updated: boolean }> {
    const projectId = session.metadata?.projectId;
    const donorUserId = session.metadata?.donorUserId;
    if (!projectId || !donorUserId) return { updated: false };
    const donation = await this.prisma.donation.findFirst({
      where: { stripeCheckoutSessionId: session.id },
    });
    if (!donation) return { updated: false };
    if (donation.status === DonationStatus.SUCCEEDED) return { updated: false };
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent as Stripe.PaymentIntent | null)?.id;
    await this.prisma.donation.update({
      where: { id: donation.id },
      data: {
        status: DonationStatus.SUCCEEDED,
        ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
      },
    });
    await this.prisma.project.update({
      where: { id: projectId },
      data: { raisedAmountMinor: { increment: donation.amountMinor } },
    });
    return { updated: true };
  }

  async handleStripeEvent(rawBody: Buffer, signature: string | string[] | undefined) {
    if (!signature) return { received: false };
    const whSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET')?.trim();
    const apiKey = this.config.get<string>('STRIPE_SECRET_KEY')?.trim();
    if (!whSecret || !apiKey) {
      this.logger.warn(
        'Stripe webhook ignored: set STRIPE_WEBHOOK_SECRET (e.g. from `stripe listen`) and STRIPE_SECRET_KEY',
      );
      return { received: false, error: 'stripe_not_configured' };
    }
    const stripe = this.getStripe();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature as string, whSecret);
    } catch {
      return { received: false, error: 'sig' };
    }
    const existing = await this.prisma.stripeEvent.findUnique({ where: { stripeId: event.id } });
    if (existing) return { received: true, duplicate: true };
    await this.prisma.stripeEvent.create({ data: { stripeId: event.id, type: event.type } });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.finalizeCheckoutSessionIfNeeded(session);
    }
    return { received: true };
  }

  private assertMpesaEnv() {
    for (const key of [
      'MPESA_CONSUMER_KEY',
      'MPESA_CONSUMER_SECRET',
      'MPESA_SHORTCODE',
      'MPESA_PASSKEY',
      'MPESA_STK_CALLBACK_URL',
    ] as const) {
      this.config.getOrThrow<string>(key);
    }
  }

  async initiateMpesaStk(donorId: string, role: UserRole, body: MpesaInitiateDto) {
    if (role !== UserRole.DONOR) throw new BadRequestException('Only donors can donate');
    this.assertMpesaEnv();
    const project = await this.prisma.project.findFirst({
      where: {
        id: body.projectId,
        status: ProjectStatus.PUBLISHED,
        organization: { status: OrganizationStatus.APPROVED },
      },
    });
    if (!project) throw new NotFoundException();
    if (project.currency.toUpperCase() !== 'KES') {
      throw new BadRequestException('M-Pesa is only available for KES projects');
    }
    const phone254 = this.mpesa.normalizeKenyaPhone(body.phone);
    if (!phone254) throw new BadRequestException('Invalid Kenya phone number');
    const amountShillings = MpesaService.kesShillingsFromStripeMinorUnits(body.amountMinor);
    const stk = await this.mpesa.initiateStkPush({
      phone254,
      amountShillings,
      accountReference: project.id.slice(0, 12),
      transactionDesc: 'Donation',
    });
    if (stk.ResponseCode !== '0' || !stk.MerchantRequestID || !stk.CheckoutRequestID) {
      throw new BadRequestException(stk.ResponseDescription ?? stk.CustomerMessage ?? 'STK request failed');
    }
    const donation = await this.prisma.donation.create({
      data: {
        donorUserId: donorId,
        projectId: project.id,
        amountMinor: body.amountMinor,
        currency: project.currency,
        status: DonationStatus.PENDING,
        mpesaMerchantRequestId: stk.MerchantRequestID,
        mpesaCheckoutRequestId: stk.CheckoutRequestID,
        mpesaPhone: phone254,
      },
    });
    return {
      donationId: donation.id,
      customerMessage: stk.CustomerMessage,
      merchantRequestId: stk.MerchantRequestID,
      checkoutRequestId: stk.CheckoutRequestID,
    };
  }

  async handleMpesaStkCallback(payload: unknown) {
    const stk = this.mpesa.parseStkCallback(payload);
    if (!stk?.MerchantRequestID) {
      this.logger.warn('M-Pesa STK callback missing MerchantRequestID');
      return { ok: false };
    }
    const donation = await this.prisma.donation.findFirst({
      where: { mpesaMerchantRequestId: stk.MerchantRequestID },
    });
    if (!donation) {
      this.logger.warn(`No donation for MerchantRequestID ${stk.MerchantRequestID}`);
      return { ok: false };
    }
    if (donation.status === DonationStatus.SUCCEEDED) return { ok: true, duplicate: true };
    if (stk.ResultCode === 0) {
      const meta = MpesaService.callbackMetadataItems(stk);
      const receipt = meta.MpesaReceiptNumber != null ? String(meta.MpesaReceiptNumber) : '';
      await this.finalizeMpesaDonationSuccess(donation.id, receipt || null);
      return { ok: true };
    }
    await this.prisma.donation.update({
      where: { id: donation.id },
      data: { status: DonationStatus.FAILED },
    });
    return { ok: true, failed: true };
  }

  async refreshMpesaDonationStatus(donorId: string, donationId: string) {
    this.assertMpesaEnv();
    const donation = await this.prisma.donation.findFirst({
      where: { id: donationId, donorUserId: donorId },
    });
    if (!donation) throw new NotFoundException();
    if (!donation.mpesaCheckoutRequestId || !donation.mpesaMerchantRequestId) {
      throw new BadRequestException('Not an M-Pesa donation');
    }
    if (donation.status === DonationStatus.SUCCEEDED) {
      return { status: donation.status, mpesaReceiptNumber: donation.mpesaReceiptNumber };
    }
    const q = await this.mpesa.queryStkStatus(donation.mpesaCheckoutRequestId, donation.mpesaMerchantRequestId);
    if (Number(q.ResultCode) === 0 && q.MpesaReceiptNumber?.length) {
      await this.finalizeMpesaDonationSuccess(donation.id, q.MpesaReceiptNumber);
      const updated = await this.prisma.donation.findUnique({ where: { id: donation.id } });
      return { status: updated?.status, mpesaReceiptNumber: updated?.mpesaReceiptNumber };
    }
    return { status: donation.status, mpesaQuery: { resultCode: q.ResultCode, resultDesc: q.ResultDesc } };
  }

  private async finalizeMpesaDonationSuccess(donationId: string, mpesaReceiptNumber: string | null) {
    await this.prisma.$transaction(async (tx) => {
      const d = await tx.donation.findUnique({ where: { id: donationId } });
      if (!d || d.status !== DonationStatus.PENDING) return;
      await tx.donation.update({
        where: { id: donationId },
        data: {
          status: DonationStatus.SUCCEEDED,
          ...(mpesaReceiptNumber ? { mpesaReceiptNumber } : {}),
        },
      });
      await tx.project.update({
        where: { id: d.projectId },
        data: { raisedAmountMinor: { increment: d.amountMinor } },
      });
    });
  }
}
