import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { PostChatMessageDto } from './dto/chat.dto';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('rooms/:orgId/messages')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.DONOR, UserRole.NGO_USER, UserRole.PLATFORM_ADMIN)
  list(@CurrentUser() user: AuthUser, @Param('orgId') orgId: string) {
    return this.chat.listMessages(user.id, user.role as UserRole, orgId);
  }

  @Post('rooms/:orgId/messages')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.DONOR, UserRole.NGO_USER, UserRole.PLATFORM_ADMIN)
  post(
    @CurrentUser() user: AuthUser,
    @Param('orgId') orgId: string,
    @Body() dto: PostChatMessageDto,
  ) {
    return this.chat.postMessage(
      user.id,
      user.role as UserRole,
      orgId,
      dto.body,
    );
  }
}
