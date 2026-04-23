import { IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CheckoutDto {
  @IsString()
  projectId: string;

  @IsInt()
  @Min(1)
  amountMinor: number;
}

export class CheckoutVerifyDto {
  @IsString()
  @MinLength(10)
  sessionId: string;
}

export class MpesaInitiateDto {
  @IsString()
  projectId: string;

  /** Stored minor units (KES: 100 = 1 shilling). Frontend sends major units converted the same way as card checkout. */
  @IsInt()
  @Min(100)
  amountMinor: number;

  @IsString()
  @MinLength(9)
  @MaxLength(20)
  phone: string;
}
