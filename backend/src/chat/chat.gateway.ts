import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UserRole } from '@prisma/client';
import type { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/jwt.strategy';
import { ChatService } from './chat.service';

type SocketUser = { id: string; role: UserRole };

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly chat: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    const token = (client.handshake.auth as { token?: string } | undefined)
      ?.token;
    if (!token) {
      client.disconnect(true);
      return;
    }
    try {
      const payload = this.jwt.verify<JwtPayload>(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) {
        client.disconnect(true);
        return;
      }
      (client.data as { user?: SocketUser }).user = {
        id: user.id,
        role: user.role,
      };
    } catch (e) {
      this.logger.warn(`WS auth failed: ${String(e)}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join')
  async join(@ConnectedSocket() client: Socket, @MessageBody() orgId: string) {
    const u = (client.data as { user?: SocketUser }).user;
    if (!u || typeof orgId !== 'string') return { ok: false };
    await client.join(this.roomName(orgId));
    return { ok: true };
  }

  @SubscribeMessage('send')
  async send(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { orgId: string; body: string },
  ) {
    const u = (client.data as { user?: SocketUser }).user;
    if (!u || !body?.orgId || typeof body.body !== 'string')
      return { ok: false };
    const msg = await this.chat.postMessage(
      u.id,
      u.role,
      body.orgId,
      body.body,
    );
    this.server.to(this.roomName(body.orgId)).emit('message', msg);
    return { ok: true, message: msg };
  }

  private roomName(orgId: string) {
    return `org:${orgId}`;
  }
}
