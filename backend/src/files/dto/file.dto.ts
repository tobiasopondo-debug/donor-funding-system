import { FileKind } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class PresignDto {
  @IsEnum(FileKind)
  kind: FileKind;

  @IsString()
  @MinLength(1)
  fileName: string;

  @IsString()
  mimeType: string;

  @IsInt()
  @Min(1)
  sizeBytes: number;

  @IsOptional()
  @IsString()
  projectId?: string;
}

export class ConfirmFileDto {
  @IsString()
  objectKey: string;

  @IsString()
  bucket: string;

  @IsEnum(FileKind)
  kind: FileKind;

  @IsString()
  mimeType: string;

  @IsInt()
  @Min(1)
  sizeBytes: number;

  @IsOptional()
  @IsString()
  projectId?: string;
}
