import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCanAccessChat(
    userId: string,
    role: UserRole,
    orgId: string,
  ) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!org || org.status !== OrganizationStatus.APPROVED)
      throw new NotFoundException();
    if (role === UserRole.PLATFORM_ADMIN) return org;
    if (role === UserRole.NGO_USER && org.ownerUserId === userId) return org;
    if (role === UserRole.DONOR) return org;
    throw new ForbiddenException();
  }

  async getOrCreateRoom(orgId: string) {
    let room = await this.prisma.chatRoom.findUnique({ where: { orgId } });
    if (!room) {
      room = await this.prisma.chatRoom.create({ data: { orgId } });
    }
    return room;
  }

  async listMessages(userId: string, role: UserRole, orgId: string) {
    await this.assertCanAccessChat(userId, role, orgId);
    const room = await this.getOrCreateRoom(orgId);
    const messages = await this.prisma.chatMessage.findMany({
      where: { roomId: room.id },
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: { author: { select: { id: true, email: true, role: true } } },
    });
    return { messages, nextCursor: undefined as string | undefined };
  }

  async postMessage(
    userId: string,
    role: UserRole,
    orgId: string,
    body: string,
  ) {
    await this.assertCanAccessChat(userId, role, orgId);
    const trimmed = body.trim();
    if (!trimmed.length)
      throw new BadRequestException('Message cannot be empty');
    const room = await this.getOrCreateRoom(orgId);
    return this.prisma.chatMessage.create({
      data: { roomId: room.id, authorId: userId, body: trimmed },
      include: { author: { select: { id: true, email: true, role: true } } },
    });
  }
}
