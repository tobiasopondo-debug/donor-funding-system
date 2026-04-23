import { IsString, MinLength } from 'class-validator';

export class CreateProjectUpdateDto {
  @IsString()
  @MinLength(1)
  body: string;
}
