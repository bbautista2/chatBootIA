import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
@Injectable()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token as string);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        client.disconnect();
        return;
      }

      (client as any).user = user;

      client.join('global');

      const accounts = await this.prisma.account.findMany({
        select: { id: true },
      });

      for (const account of accounts) {
        client.join(`account:${account.id}`);
      }

      this.logger.log(`Client connected: ${client.id} (user: ${user.email})`);
    } catch (error) {
      this.logger.error(`Connection failed: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-account')
  handleJoinAccount(@ConnectedSocket() client: Socket, @MessageBody() data: { accountId: string }) {
    client.join(`account:${data.accountId}`);
    return { event: 'joined-account', data: { accountId: data.accountId } };
  }

  @SubscribeMessage('leave-account')
  handleLeaveAccount(@ConnectedSocket() client: Socket, @MessageBody() data: { accountId: string }) {
    client.leave(`account:${data.accountId}`);
    return { event: 'left-account', data: { accountId: data.accountId } };
  }

  notifyNewMessage(accountId: string, conversationId: string, message: any) {
    this.server.to(`account:${accountId}`).emit('new-message', {
      accountId,
      conversationId,
      message,
    });
  }

  notifyConversationUpdate(accountId: string, conversationId: string, status: string) {
    this.server.to(`account:${accountId}`).emit('conversation-update', {
      accountId,
      conversationId,
      status,
    });
  }
}
