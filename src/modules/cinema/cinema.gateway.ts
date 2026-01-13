import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CinemaService } from './cinema.service';
import { NotFoundException } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: true,
    },
})
export class CinemaGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private userSockets = new Map<string, string>(); // userId -> socketId

    constructor(private readonly cinemaService: CinemaService) { }

    async handleConnection(client: Socket) {
        const userId = client.handshake.query?.userId as string;

        if (userId) {
            this.userSockets.set(userId, client.id);
            console.log(`🔌 User ${userId} connected with socket ${client.id}`);
        } else {
            console.log(`🔌 Anonymous client connected: ${client.id}`);
        }
    }

    async handleDisconnect(client: Socket) {
        const userId = Array.from(this.userSockets.entries())
            .find(([, socketId]) => socketId === client.id)?.[0];

        if (userId) {
            const roomId = await this.cinemaService.getUserCurrentRoom(userId);

            if (roomId) {
                await this.cinemaService.leaveRoom(roomId, userId);

                // Get updated viewers list after user left
                const viewersWithSocketIds = await this.cinemaService.getRoomUsersWithSocketIds(roomId);

                this.server.to(roomId).emit('userLeft', {
                    userId,
                    viewers: viewersWithSocketIds,
                });
            }

            this.userSockets.delete(userId);
            console.log(`🔌 User ${userId} disconnected`);
        }
    }

    @SubscribeMessage('joinRoom')
    async handleJoinRoom(
        @MessageBody() data: { roomId: string; userId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            console.log(`🎯 JOIN ROOM Socket Event - userId: ${data.userId}, socketId: ${client.id}`);

            const { room, role } = await this.cinemaService.joinRoom(
                data.roomId,
                data.userId,
                client.id,
            );

            const chatHistory = await this.cinemaService.getChatMessages(data.roomId);
            const viewersWithSocketIds = await this.cinemaService.getRoomUsersWithSocketIds(data.roomId);
            client.join(data.roomId);

            // Nếu room đang playing, yêu cầu host gửi currentTime thực tế
            if (room.isPlaying && room.hostId) {
                const hostSocketId = this.userSockets.get(String(room.hostId));
                if (hostSocketId) {
                    // Gửi event yêu cầu host gửi currentTime
                    this.server.to(hostSocketId).emit('requestCurrentTime', {
                        requesterId: data.userId,
                        roomId: data.roomId,
                    });
                    // Tạm thời gửi currentState từ DB, lát nữa sẽ gửi lại khi host phản hồi
                }
            }

            client.emit('roomJoined', {
                room,
                role,
                currentState: {
                    currentTime: room.currentTime,
                    isPlaying: room.isPlaying,
                    playbackRate: room.playbackRate,
                    volume: room.volume,
                },
                chatHistory,
                viewers: viewersWithSocketIds,
            });

            this.server.to(data.roomId).emit('userJoined', {
                userId: data.userId,
                role,
                viewers: viewersWithSocketIds,
            });

            console.log(`✅ Socket: User ${data.userId} joined room ${data.roomId}`);
        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }
    // Host nhận event này, gửi currentTime thực tế về backend
    @SubscribeMessage('currentTimeResponse')
    async handleCurrentTimeResponse(
        @MessageBody() data: { roomId: string; requesterId: string; currentTime: number },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const { roomId, requesterId, currentTime } = data;
            const requesterSocketId = this.userSockets.get(String(requesterId));
            if (requesterSocketId) {
                this.server.to(requesterSocketId).emit('syncCurrentTime', {
                    currentTime,
                    isPlaying: true,
                });
                console.log(`⏱️ Sent real currentTime (${currentTime}) to user ${requesterId}`);
            }
        } catch (error) {
            console.error('❌ handleCurrentTimeResponse error:', error);
        }
    }

    @SubscribeMessage('leaveRoom')
    async handleLeaveRoom(
        @MessageBody() data: { roomId: string; userId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            await this.cinemaService.leaveRoom(data.roomId, data.userId);

            // Get updated viewers list
            const viewersWithSocketIds = await this.cinemaService.getRoomUsersWithSocketIds(data.roomId);

            client.leave(data.roomId);
            client.to(data.roomId).emit('userLeft', {
                userId: data.userId,
                viewers: viewersWithSocketIds,
            });

            client.emit('roomLeft', { roomId: data.roomId });
        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }

    @SubscribeMessage('playerAction')
    async handlePlayerAction(
        @MessageBody() data: {
            roomId: string;
            userId: string;
            action: 'play' | 'pause' | 'seek' | 'volumeChange' | 'rateChange';
            value?: number;
        },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const updateDto: any = { roomId: data.roomId };

            switch (data.action) {
                case 'play':
                    updateDto.isPlaying = true;
                    // When host plays, sync their current time
                    if (data.value !== undefined) {
                        updateDto.currentTime = data.value;
                    }
                    break;
                case 'pause':
                    updateDto.isPlaying = false;
                    // When host pauses, sync their current time
                    if (data.value !== undefined) {
                        updateDto.currentTime = data.value;
                    }
                    break;
                case 'seek':
                    updateDto.currentTime = data.value;
                    break;
                case 'volumeChange':
                    updateDto.volume = data.value;
                    break;
                case 'rateChange':
                    updateDto.playbackRate = data.value;
                    break;
            }

            const room = await this.cinemaService.updatePlayerState(
                data.roomId,
                data.userId,
                updateDto,
            );

            const stateUpdate = {
                action: data.action,
                value: data.value,
                currentTime: room.currentTime,
                isPlaying: room.isPlaying,
                playbackRate: room.playbackRate,
                volume: room.volume,
                updatedBy: data.userId,
            };

            // Emit to ALL clients in room (including sender) for full sync
            this.server.in(data.roomId).emit('playerStateChanged', stateUpdate);

            console.log(`🎬 ${data.action} action by ${data.userId} in room ${data.roomId}`);
            console.log(`   📡 Broadcasting state:`, stateUpdate);
        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @MessageBody() data: { roomId: string; userId: string; text: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const room = await this.cinemaService.getRoom(data.roomId);
            if (!room) {
                throw new NotFoundException('Room not found');
            }

            const message = {
                userId: data.userId,
                text: data.text,
                createdAt: new Date().toISOString(),
            };

            await this.cinemaService.appendChatMessage(data.roomId, message);
            this.server.to(data.roomId).emit('chatMessage', message);
        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }

    @SubscribeMessage('setPermissions')
    async handleSetPermissions(
        @MessageBody() data: {
            roomId: string;
            hostId: string;
            viewerId: string;
            permissions: string[];
        },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const room = await this.cinemaService.setViewerPermissions(
                data.roomId,
                data.hostId,
                data.viewerId,
                data.permissions as any,
            );

            const viewerSocketId = this.userSockets.get(data.viewerId);
            if (viewerSocketId) {
                this.server.to(viewerSocketId).emit('permissionsUpdated', {
                    permissions: data.permissions,
                });
            }

            client.emit('permissionsSet', {
                viewerId: data.viewerId,
                permissions: data.permissions,
            });

            console.log(`🔐 Permissions updated for ${data.viewerId} in room ${data.roomId}`);
        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }

    @SubscribeMessage('kickViewer')
    async handleKickViewer(
        @MessageBody() data: {
            roomId: string;
            hostId: string;
            viewerId: string;
        },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            await this.cinemaService.kickViewer(data.roomId, data.hostId, data.viewerId);

            const viewerSocketId = this.userSockets.get(data.viewerId);
            if (viewerSocketId) {
                this.server.to(viewerSocketId).emit('kicked', {
                    roomId: data.roomId,
                    message: 'You have been kicked from the room',
                });
                this.server.sockets.sockets.get(viewerSocketId)?.leave(data.roomId);
            }

            client.to(data.roomId).emit('viewerKicked', {
                viewerId: data.viewerId,
            });

            console.log(`⚠️ Viewer ${data.viewerId} kicked from room ${data.roomId}`);
        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }

    @SubscribeMessage('syncRequest')
    async handleSyncRequest(
        @MessageBody() data: { roomId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const room = await this.cinemaService.getRoom(data.roomId);

            client.emit('syncResponse', {
                currentTime: room.currentTime,
                isPlaying: room.isPlaying,
                playbackRate: room.playbackRate,
                volume: room.volume,
            });
        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }
}