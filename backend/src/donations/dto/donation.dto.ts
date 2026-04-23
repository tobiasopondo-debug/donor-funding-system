import { IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CheckoutDto {
  @IsString()
  projectId: string;

  @IsInt()
  @Min(1)
  amountMinor: number;
}

export class MpesaInitiateDto {
  @IsString()
  projectId: string;

  /** Stripe-style minor units (cents); converted to whole KES for STK. */
  @IsInt()
  @Min(100)
  amountMinor: number;

  @IsString()
  @MinLength(9)
  @MaxLength(20)
  phone: string;
}
