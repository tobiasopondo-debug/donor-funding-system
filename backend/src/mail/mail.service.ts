import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { buildOtpEmail } from './otp-email.template';

@Injectable()
export class MailService {
  constructor(private readonly config: ConfigService) {}

  private createTransport(): nodemailer.Transporter {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const pass = this.config.get<string>('SMTP_PASS')?.trim();
    const fromEmail = this.config.get<string>('SMTP_FROM_EMAIL')?.trim();
    if (!host || !user || !pass || !fromEmail) {
      throw new ServiceUnavailableException(
        'Email delivery is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM_EMAIL (and optionally SMTP_PORT, SMTP_SECURE, SMTP_FROM_NAME) on the API server.',
      );
    }
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);
    const secure =
      String(
        this.config.get<string>('SMTP_SECURE') ?? 'false',
      ).toLowerCase() === 'true';
    const tlsRejectRaw =
      this.config.get<string>('SMTP_TLS_REJECT_UNAUTHORIZED') ?? 'true';
    const rejectUnauthorized =
      String(tlsRejectRaw).toLowerCase() !== 'false' &&
      String(tlsRejectRaw) !== '0';
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized },
    });
  }

  async sendOtpEmail(
    to: string,
    code: string,
    purpose: 'REGISTER' | 'LOGIN',
  ): Promise<void> {
    const fromEmail = this.config.get<string>('SMTP_FROM_EMAIL')!.trim();
    const fromName =
      this.config.get<string>('SMTP_FROM_NAME')?.trim() ?? 'DonorConnect Kenya';
    const brandName = fromName;
    const { subject, html } = buildOtpEmail({
      code,
      purpose,
      brandName,
      year: new Date().getFullYear(),
    });
    const transport = this.createTransport();
    await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text: `${purpose === 'REGISTER' ? 'Verify your account' : 'Sign-in verification'} — code: ${code} (expires in 10 minutes)`,
    });
  }
}
