import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface ConnectedUser {
    socketId: string;
    userId: string;
    groupIds: string[];
}

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    },
    namespace: '/',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger = new Logger('RealtimeGateway');
    private connectedUsers: Map<string, ConnectedUser> = new Map();

    constructor(private jwtService: JwtService) { }

    handleConnection(client: Socket) {
        const token = client.handshake.auth.token || client.handshake.query.token as string;

        if (!token) {
            this.logger.warn(`Connection rejected: no token from ${client.id}`);
            client.disconnect();
            return;
        }

        try {
            const decoded = this.jwtService.verify(token);
            const userId = decoded.sub || decoded.id;

            this.connectedUsers.set(client.id, {
                socketId: client.id,
                userId,
                groupIds: [],
            });

            client.join(`user:${userId}`);
            this.logger.log(`✅ User ${userId} connected (${client.id})`);
        } catch (error) {
            this.logger.error(`Invalid token: ${error.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const user = this.connectedUsers.get(client.id);
        if (user) {
            this.logger.log(`❌ User ${user.userId} disconnected`);
            this.connectedUsers.delete(client.id);
        }
    }

    @SubscribeMessage('subscribe-group')
    handleSubscribeGroup(client: Socket, groupId: string) {
        if (!groupId) return;

        const user = this.connectedUsers.get(client.id);
        if (!user) {
            this.logger.warn(`Subscribe rejected (unauthenticated): ${client.id}`);
            client.disconnect();
            return;
        }

        client.join(`group:${groupId}`);
        if (!user.groupIds.includes(groupId)) {
            user.groupIds.push(groupId);
        }
        this.logger.log(`User ${user.userId} subscribed to group ${groupId}`);
    }

    @SubscribeMessage('unsubscribe-group')
    handleUnsubscribeGroup(client: Socket, groupId: string) {
        if (!groupId) return;

        const user = this.connectedUsers.get(client.id);
        if (!user) return;

        client.leave(`group:${groupId}`);
        user.groupIds = user.groupIds.filter((id) => id !== groupId);
        this.logger.log(`User ${user.userId} unsubscribed from group ${groupId}`);
    }

    /**
     * Broadcast expense added event to group members
     */
    broadcastExpenseAdded(groupId: string, data: any) {
        this.server.to(`group:${groupId}`).emit('expense-added', {
            type: 'expense-added',
            data,
            timestamp: Date.now(),
        });
    }

    /**
     * Broadcast expense updated event
     */
    broadcastExpenseUpdated(groupId: string, data: any) {
        this.server.to(`group:${groupId}`).emit('expense-updated', {
            type: 'expense-updated',
            data,
            timestamp: Date.now(),
        });
    }

    /**
     * Broadcast expense deleted event
     */
    broadcastExpenseDeleted(groupId: string, data: any) {
        this.server.to(`group:${groupId}`).emit('expense-deleted', {
            type: 'expense-deleted',
            data,
            timestamp: Date.now(),
        });
    }

    /**
     * Broadcast group updated event
     */
    broadcastGroupUpdated(groupId: string, data: any) {
        this.server.to(`group:${groupId}`).emit('group-updated', {
            type: 'group-updated',
            data,
            timestamp: Date.now(),
        });
    }

    /**
     * Broadcast debt settled event
     */
    broadcastDebtSettled(groupId: string, data: any) {
        this.server.to(`group:${groupId}`).emit('debt-settled', {
            type: 'debt-settled',
            data,
            timestamp: Date.now(),
        });
    }

    /**
     * Subscribe user to group room
     */
    subscribeToGroup(userId: string, groupId: string) {
        const userConnections = Array.from(this.connectedUsers.entries())
            .filter(([_, user]) => user.userId === userId)
            .map(([socketId, _]) => socketId);

        userConnections.forEach((socketId) => {
            const io = this.server.sockets.sockets.get(socketId);
            if (io) {
                io.join(`group:${groupId}`);
                const user = this.connectedUsers.get(socketId);
                if (user && !user.groupIds.includes(groupId)) {
                    user.groupIds.push(groupId);
                }
            }
        });
    }

    /**
     * Unsubscribe user from group room
     */
    unsubscribeFromGroup(userId: string, groupId: string) {
        const userConnections = Array.from(this.connectedUsers.entries())
            .filter(([_, user]) => user.userId === userId)
            .map(([socketId, _]) => socketId);

        userConnections.forEach((socketId) => {
            const io = this.server.sockets.sockets.get(socketId);
            if (io) {
                io.leave(`group:${groupId}`);
                const user = this.connectedUsers.get(socketId);
                if (user) {
                    user.groupIds = user.groupIds.filter((id) => id !== groupId);
                }
            }
        });
    }
}
