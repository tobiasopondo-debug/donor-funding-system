import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type StkInitResponse = {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResponseCode?: string;
  ResponseDescription?: string;
  CustomerMessage?: string;
};

type StkCallbackBody = {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      CallbackMetadata?: { Item?: Array<{ Name?: string; Value?: string | number }> };
    };
  };
};

export type StkCallbackInner = NonNullable<StkCallbackBody['Body']>['stkCallback'];

type StkQueryResponse = {
  ResultCode?: string | number;
  ResultDesc?: string;
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  Amount?: string;
  MpesaReceiptNumber?: string;
  TransactionDate?: string;
  PhoneNumber?: string;
  ResultParameters?: { ResultParameter?: Array<{ Key: string; Value: string | number }> };
};

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);

  constructor(private readonly config: ConfigService) {}

  private baseUrl(): string {
    const env = (this.config.get<string>('MPESA_ENVIRONMENT') ?? 'sandbox').toLowerCase();
    return env === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  async getAccessToken(): Promise<string> {
    const key = this.config.getOrThrow<string>('MPESA_CONSUMER_KEY');
    const secret = this.config.getOrThrow<string>('MPESA_CONSUMER_SECRET');
    const auth = Buffer.from(`${key}:${secret}`).toString('base64');
    const url = `${this.baseUrl()}/oauth/v1/generate?grant_type=client_credentials`;
    const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
    if (!res.ok) {
      const text = await res.text();
      this.logger.warn(`OAuth failed ${res.status}: ${text}`);
      throw new Error('M-Pesa OAuth failed');
    }
    const data = (await res.json()) as { access_token: string };
    return data.access_token;
  }

  /** Daraja: Base64( BusinessShortCode + PassKey + Timestamp ) — all as plain strings, no separators. */
  buildPassword(shortcode: string, passkey: string, timestamp: string): string {
    const sc = String(shortcode).trim();
    const pk = String(passkey).trim();
    return Buffer.from(`${sc}${pk}${timestamp}`).toString('base64');
  }

  private stkTransactionType(): 'CustomerPayBillOnline' | 'CustomerBuyGoodsOnline' {
    const raw = (this.config.get<string>('MPESA_TRANSACTION_TYPE') ?? 'CustomerPayBillOnline').trim();
    if (raw === 'CustomerBuyGoodsOnline') return 'CustomerBuyGoodsOnline';
    if (raw === 'CustomerPayBillOnline') return 'CustomerPayBillOnline';
    this.logger.warn(`Invalid MPESA_TRANSACTION_TYPE "${raw}", defaulting to CustomerPayBillOnline`);
    return 'CustomerPayBillOnline';
  }

  /** KES whole shillings for STK Amount field (M-Pesa uses integer shillings). */
  static kesShillingsFromStripeMinorUnits(amountMinor: number): number {
    const shillings = Math.floor(amountMinor / 100);
    return Math.max(1, shillings);
  }

  normalizeKenyaPhone(input: string): string | null {
    const digits = input.replace(/\D/g, '');
    if (digits.startsWith('254') && digits.length === 12) return digits;
    if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`;
    if (digits.length === 9 && digits.startsWith('7')) return `254${digits}`;
    return null;
  }

  async initiateStkPush(params: {
    phone254: string;
    amountShillings: number;
    accountReference: string;
    transactionDesc: string;
  }): Promise<StkInitResponse> {
    const shortcode = this.config.getOrThrow<string>('MPESA_SHORTCODE');
    const passkey = this.config.getOrThrow<string>('MPESA_PASSKEY');
    const callbackUrl = this.config.getOrThrow<string>('MPESA_STK_CALLBACK_URL');
    const partyB = this.config.get<string>('MPESA_PARTY_B') ?? shortcode;
    const token = await this.getAccessToken();
    const timestamp = this.formatTimestamp(new Date());
    const password = this.buildPassword(shortcode, passkey, timestamp);
    const transactionType = this.stkTransactionType();
    const body = {
      BusinessShortCode: Number(String(shortcode).trim()),
      Password: password,
      Timestamp: timestamp,
      TransactionType: transactionType,
      Amount: params.amountShillings,
      PartyA: Number(params.phone254),
      PartyB: Number(String(partyB).trim()),
      PhoneNumber: params.phone254,
      CallBackURL: callbackUrl,
      AccountReference: params.accountReference.slice(0, 12),
      TransactionDesc: params.transactionDesc.slice(0, 13),
    };
    const res = await fetch(`${this.baseUrl()}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as StkInitResponse;
    if (!res.ok) {
      this.logger.warn(`STK HTTP ${res.status}: ${JSON.stringify(data)}`);
    }
    return data;
  }

  async queryStkStatus(checkoutRequestId: string, merchantRequestId: string): Promise<StkQueryResponse> {
    const shortcode = this.config.getOrThrow<string>('MPESA_SHORTCODE');
    const passkey = this.config.getOrThrow<string>('MPESA_PASSKEY');
    const token = await this.getAccessToken();
    const timestamp = this.formatTimestamp(new Date());
    const password = this.buildPassword(shortcode, passkey, timestamp);
    const payload = {
      BusinessShortCode: Number(shortcode),
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
      MerchantRequestID: merchantRequestId,
    };
    const res = await fetch(`${this.baseUrl()}/mpesa/stkpushquery/v1/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const raw = (await res.json()) as {
      ResultCode?: string;
      ResultDesc?: string;
      CheckoutRequestID?: string;
      MerchantRequestID?: string;
      CallbackMetadata?: StkQueryResponse['ResultParameters'];
      ResultParameters?: StkQueryResponse['ResultParameters'];
    };
    if (!res.ok) {
      this.logger.warn(`STK query HTTP ${res.status}: ${JSON.stringify(raw)}`);
      return { ResultCode: raw.ResultCode, ResultDesc: raw.ResultDesc };
    }
    return this.flattenQueryResult(raw);
  }

  private flattenQueryResult(raw: {
    ResultCode?: string;
    ResultDesc?: string;
    CheckoutRequestID?: string;
    MerchantRequestID?: string;
    CallbackMetadata?: {
      ResultParameter?: Array<{ Key: string; Value: string | number }>;
      Item?: Array<{ Name?: string; Value?: string | number }>;
    };
    ResultParameters?: { ResultParameter?: Array<{ Key: string; Value: string | number }> };
  }): StkQueryResponse {
    const out: StkQueryResponse = {
      ResultCode: raw.ResultCode != null ? String(raw.ResultCode) : undefined,
      ResultDesc: raw.ResultDesc,
      MerchantRequestID: raw.MerchantRequestID,
      CheckoutRequestID: raw.CheckoutRequestID,
    };
    const params = raw.ResultParameters?.ResultParameter ?? raw.CallbackMetadata?.ResultParameter;
    if (params) {
      for (const p of params) {
        if (p.Key === 'Amount') out.Amount = String(p.Value);
        if (p.Key === 'MpesaReceiptNumber') out.MpesaReceiptNumber = String(p.Value);
        if (p.Key === 'TransactionDate') out.TransactionDate = String(p.Value);
        if (p.Key === 'PhoneNumber' || p.Key === 'Phone Number') out.PhoneNumber = String(p.Value);
      }
      return out;
    }
    const items = raw.CallbackMetadata?.Item;
    if (items) {
      for (const it of items) {
        if (it.Name === 'Amount') out.Amount = String(it.Value);
        if (it.Name === 'MpesaReceiptNumber') out.MpesaReceiptNumber = String(it.Value);
        if (it.Name === 'TransactionDate') out.TransactionDate = String(it.Value);
        if (it.Name === 'PhoneNumber' || it.Name === 'Phone Number') out.PhoneNumber = String(it.Value);
      }
    }
    return out;
  }

  private formatTimestamp(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
      `${d.getFullYear()}` +
      `${pad(d.getMonth() + 1)}` +
      `${pad(d.getDate())}` +
      `${pad(d.getHours())}` +
      `${pad(d.getMinutes())}` +
      `${pad(d.getSeconds())}`
    );
  }

  parseStkCallback(payload: unknown): StkCallbackInner | undefined {
    const b = payload as StkCallbackBody & { stkCallback?: StkCallbackInner };
    return b.Body?.stkCallback ?? b.stkCallback;
  }

  static callbackMetadataItems(stk: StkCallbackInner | undefined): Record<string, string | number> {
    const map: Record<string, string | number> = {};
    const items = stk?.CallbackMetadata?.Item ?? [];
    for (const it of items) {
      if (it.Name != null && it.Value !== undefined) map[it.Name] = it.Value;
    }
    return map;
  }
}
