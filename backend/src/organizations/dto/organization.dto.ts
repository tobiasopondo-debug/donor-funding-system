import { $Enums } from '@prisma/client';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  legalName: string;

  @IsString()
  @MinLength(2)
  displayName: string;

  @IsString()
  @MinLength(10)
  mission: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsEmail()
  contactEmail: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;
}

export class AdminReviewDto {
  @IsIn([
    $Enums.OrganizationStatus.APPROVED,
    $Enums.OrganizationStatus.REJECTED,
    $Enums.OrganizationStatus.SUSPENDED,
  ])
  status: $Enums.OrganizationStatus;

  @IsOptional()
  @IsString()
  reviewNote?: string;
}
