import { UserRole } from '@prisma/client';
import { IsEmail, IsIn, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsIn([UserRole.DONOR, UserRole.NGO_USER])
  role: UserRole;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class VerifyOtpDto {
  @IsString()
  @MinLength(10)
  challengeId: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Code must be exactly 6 digits' })
  code: string;
}

export class ResendOtpDto {
  @IsString()
  @MinLength(10)
  challengeId: string;
}
