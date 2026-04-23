import { IsOptional, IsString, MinLength } from 'class-validator';

export class PostChatMessageDto {
  @IsString()
  @MinLength(1)
  body: string;
}

export class ListChatQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;
}
