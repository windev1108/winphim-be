import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisClientType } from 'redis';
// import { REDIS_CLIENT } from '../redis/redis.module';
import { Cinema, UserRole, ViewerPermission } from 'src/database/entities/cinema.entity';
import { CreateRoomDto, UpdatePlayerStateDto } from './dto/cinema.dto';

interface RoomSession {
    roomId: string;
    users: Map<string, { userId: string; role: UserRole; socketId: string }>;
    lastActivity: Date;
}

@Injectable()
export class CinemaService {
    private readonly ROOM_SESSION_PREFIX = 'room_session:';
    private readonly USER_ROOM_PREFIX = 'user_room:';
    private readonly ROOM_CHAT_PREFIX = 'room_chat:';

    constructor(
        @InjectRepository(Cinema)
        private readonly roomRepository: Repository<Cinema>,
        // @Inject(REDIS_CLIENT)
        private readonly redisClient: RedisClientType,
    ) { }

    async createRoom(hostId: string, createRoomDto: CreateRoomDto): Promise<Cinema> {
        const cinemaCode = await this.generateUniqueCinemaCode();

        const room = this.roomRepository.create({
            ...createRoomDto,
            hostId,
            cinemaCode,
            viewerIds: [],
            viewerPermissions: {},
            capacity: createRoomDto.capacity || 100,
        });

        const savedRoom = await this.roomRepository.save(room);

        // Initialize room session in Redis
        await this.initializeRoomSession(savedRoom.id, hostId, UserRole.HOST);

        console.log(`✅ Room created: ${savedRoom.id} by host: ${hostId}`);
        return savedRoom;
    }

    async getRoom(roomId: string): Promise<Cinema> {
        const room = await this.roomRepository.findOne({
            where: { id: roomId, isActive: true },
            relations: ['host']
        });
        if (!room) {
            throw new NotFoundException('Room not found');
        }
        return room;
    }

    async getAllActiveRooms(): Promise<Cinema[]> {
        return this.roomRepository.find({
            where: { isActive: true },
            relations: ['host'],
            order: { createdAt: 'DESC' },
        });
    }

    async joinRoom(roomId: string, userId: string, socketId: string): Promise<{ room: Cinema; role: UserRole }> {
        const room = await this.getRoom(roomId);
        console.log('🔍 JOIN ROOM DEBUG:');
        console.log('  - room.hostId:', room.hostId, 'type:', typeof room.hostId);
        console.log('  - userId:', userId, 'type:', typeof userId);
        console.log('  - Direct comparison (===):', room.hostId === userId);
        console.log('  - String comparison:', String(room.hostId) === String(userId));

        // Check if user is host - ensure both are strings for comparison
        if (String(room.hostId) === String(userId)) {
            console.log('✅ User is HOST');
            await this.addUserToSession(roomId, userId, UserRole.HOST, socketId);
            return { room, role: UserRole.HOST };
        }

        console.log('👀 User is VIEWER');

        // Check capacity
        const currentUsers = await this.getRoomUsers(roomId);
        if (currentUsers.size >= room.capacity) {
            throw new BadRequestException('Room is full');
        }

        // Add viewer
        if (!room.viewerIds.includes(userId)) {
            room.viewerIds.push(userId);

            // Set default permissions for new viewer
            room.viewerPermissions[userId] = [];

            await this.roomRepository.save(room);
        }

        await this.addUserToSession(roomId, userId, UserRole.VIEWER, socketId);

        console.log(`✅ User ${userId} joined room ${roomId} as viewer`);
        return { room, role: UserRole.VIEWER };
    }

    async leaveRoom(roomId: string, userId: string): Promise<void> {
        const room = await this.getRoom(roomId);

        // If host leaves, close the room
        if (String(room.hostId) === String(userId)) {
            room.isActive = false;
            await this.roomRepository.save(room);
            await this.clearRoomSession(roomId);
            console.log(`🚪 Host left, room ${roomId} closed`);
            return;
        }

        // Remove viewer
        room.viewerIds = room.viewerIds.filter(id => id !== userId);
        delete room.viewerPermissions[userId];
        await this.roomRepository.save(room);

        await this.removeUserFromSession(roomId, userId);
        await this.removeUserRoom(userId);

        console.log(`🚪 User ${userId} left room ${roomId}`);
    }

    async updatePlayerState(
        roomId: string,
        userId: string,
        updateDto: UpdatePlayerStateDto,
    ): Promise<Cinema> {
        const room = await this.getRoom(roomId);
        const isHost = String(room.hostId) === String(userId);
        console.log('🎬 UPDATE PLAYER STATE - isHost:', isHost, 'hostId:', room.hostId, 'userId:', userId);

        // Check permissions for viewers
        if (!isHost) {
            const permissions = room.viewerPermissions[userId] || [];

            if (updateDto.isPlaying !== undefined) {
                const canControl = updateDto.isPlaying
                    ? permissions.includes(ViewerPermission.CAN_PLAY)
                    : permissions.includes(ViewerPermission.CAN_PAUSE);

                if (!canControl) {
                    throw new ForbiddenException('You do not have permission to control playback');
                }
            }

            if (updateDto.currentTime !== undefined && !permissions.includes(ViewerPermission.CAN_SEEK)) {
                throw new ForbiddenException('You do not have permission to seek');
            }

            if (updateDto.volume !== undefined && !permissions.includes(ViewerPermission.CAN_CHANGE_VOLUME)) {
                throw new ForbiddenException('You do not have permission to change volume');
            }
        }

        // Update player state
        if (updateDto.currentTime !== undefined) room.currentTime = updateDto.currentTime;
        if (updateDto.isPlaying !== undefined) room.isPlaying = updateDto.isPlaying;
        if (updateDto.playbackRate !== undefined) room.playbackRate = updateDto.playbackRate;
        if (updateDto.volume !== undefined) room.volume = updateDto.volume;

        const updatedRoom = await this.roomRepository.save(room);

        console.log(`🎬 Player state updated in room ${roomId} by user ${userId}`);
        return updatedRoom;
    }

    async setViewerPermissions(
        roomId: string,
        hostId: string,
        viewerId: string,
        permissions: ViewerPermission[],
    ): Promise<Cinema> {
        const room = await this.getRoom(roomId);

        // Only host can set permissions
        if (String(room.hostId) !== String(hostId)) {
            throw new ForbiddenException('Only the host can set permissions');
        }

        if (!room.viewerIds.includes(viewerId)) {
            throw new BadRequestException('Viewer not in room');
        }

        room.viewerPermissions[viewerId] = permissions;
        const updatedRoom = await this.roomRepository.save(room);

        console.log(`🔐 Permissions set for viewer ${viewerId} in room ${roomId}`);
        return updatedRoom;
    }

    async kickViewer(roomId: string, hostId: string, viewerId: string): Promise<void> {
        const room = await this.getRoom(roomId);

        if (String(room.hostId) !== String(hostId)) {
            throw new ForbiddenException('Only the host can kick viewers');
        }

        await this.leaveRoom(roomId, viewerId);
        console.log(`⚠️ Viewer ${viewerId} kicked from room ${roomId}`);
    }

    // Redis Session Management
    private async initializeRoomSession(roomId: string, userId: string, role: UserRole): Promise<void> {
        const session: RoomSession = {
            roomId,
            users: new Map([[userId, { userId, role, socketId: '' }]]),
            lastActivity: new Date(),
        };

        await this.redisClient.set(
            `${this.ROOM_SESSION_PREFIX}${roomId}`,
            JSON.stringify({
                ...session,
                users: Array.from(session.users.entries()),
            }),
            { EX: 86400 }, // 24 hours
        );

        await this.setUserRoom(userId, roomId);
    }

    private async addUserToSession(roomId: string, userId: string, role: UserRole, socketId: string): Promise<void> {
        console.log(`➕ Adding user to session - userId: ${userId}, role: ${role}, socketId: ${socketId}`);
        const sessionKey = `${this.ROOM_SESSION_PREFIX}${roomId}`;
        const data = await this.redisClient.get(sessionKey);

        if (data) {
            const session = JSON.parse(data);

            // Ensure uniqueness by rebuilding the map then back to array
            const userMap = new Map<string, { userId: string; role: UserRole; socketId: string }>(session.users);
            userMap.set(userId, { userId, role, socketId });

            const updated = {
                ...session,
                users: Array.from(userMap.entries()),
                lastActivity: new Date(),
            };

            console.log(`💾 Saving session with users:`, JSON.stringify(updated.users, null, 2));
            await this.redisClient.set(sessionKey, JSON.stringify(updated), { EX: 86400 });
            await this.setUserRoom(userId, roomId);
        } else {
            // Session doesn't exist, initialize it
            console.log(`⚠️ Session not found, initializing for room ${roomId}`);
            await this.initializeRoomSession(roomId, userId, role);

            // Update with socketId
            const session = await this.redisClient.get(sessionKey);
            if (session) {
                const parsed = JSON.parse(session);
                const userMap = new Map<string, { userId: string; role: UserRole; socketId: string }>(parsed.users);
                userMap.set(userId, { userId, role, socketId });

                const updated = {
                    ...parsed,
                    users: Array.from(userMap.entries()),
                    lastActivity: new Date(),
                };

                await this.redisClient.set(sessionKey, JSON.stringify(updated), { EX: 86400 });
            }
        }
    }

    private async removeUserFromSession(roomId: string, userId: string): Promise<void> {
        console.log(`❌ Removing user ${userId} from session ${roomId}`);
        const sessionKey = `${this.ROOM_SESSION_PREFIX}${roomId}`;
        const data = await this.redisClient.get(sessionKey);

        if (data) {
            const session = JSON.parse(data);
            console.log(`📖 Session before remove:`, JSON.stringify(session.users, null, 2));
            session.users = session.users.filter(([id]: [string, any]) => id !== userId);
            console.log(`📖 Session after remove:`, JSON.stringify(session.users, null, 2));
            session.lastActivity = new Date();

            await this.redisClient.set(sessionKey, JSON.stringify(session), { EX: 86400 });
            await this.removeUserRoom(userId);
            console.log(`✅ Successfully removed user ${userId} from session`);
        } else {
            console.log(`⚠️ Session not found for room ${roomId}`);
        }
    }

    private async getRoomUsers(roomId: string): Promise<Map<string, any>> {
        const sessionKey = `${this.ROOM_SESSION_PREFIX}${roomId}`;
        const data = await this.redisClient.get(sessionKey);

        if (data) {
            const session = JSON.parse(data);
            return new Map(session.users);
        }

        return new Map();
    }

    async getRoomUsersWithSocketIds(roomId: string): Promise<Array<{ userId: string; role: UserRole; socketId: string }>> {
        const sessionKey = `${this.ROOM_SESSION_PREFIX}${roomId}`;
        const data = await this.redisClient.get(sessionKey);

        if (data) {
            const session = JSON.parse(data);
            console.log(`📖 Raw session data:`, JSON.stringify(session, null, 2));
            // session.users is array of [userId, userData] tuples
            const result = session.users.map(([userId, userData]: [string, any]) => ({
                userId,
                role: userData.role,
                socketId: userData.socketId || '',
            }));
            console.log(`📋 Parsed users with socketIds:`, JSON.stringify(result, null, 2));
            return result;
        }

        return [];
    }

    private async clearRoomSession(roomId: string): Promise<void> {
        await this.redisClient.del(`${this.ROOM_SESSION_PREFIX}${roomId}`);
        await this.redisClient.del(`${this.ROOM_CHAT_PREFIX}${roomId}`);
    }

    private async removeUserRoom(userId: string): Promise<void> {
        await this.redisClient.del(`${this.USER_ROOM_PREFIX}${userId}`);
    }

    private async setUserRoom(userId: string, roomId: string): Promise<void> {
        await this.redisClient.set(`${this.USER_ROOM_PREFIX}${userId}`, roomId, { EX: 86400 });
    }

    async appendChatMessage(roomId: string, message: { userId: string; text: string; createdAt: string }) {
        const key = `${this.ROOM_CHAT_PREFIX}${roomId}`;
        await this.redisClient.rPush(key, JSON.stringify(message));
        // keep last 1000 messages to avoid bloat
        await this.redisClient.lTrim(key, -1000, -1);
        await this.redisClient.expire(key, 86400);
    }

    async getChatMessages(roomId: string) {
        const key = `${this.ROOM_CHAT_PREFIX}${roomId}`;
        const raw = await this.redisClient.lRange(key, 0, -1);
        return raw.map((item) => {
            try {
                return JSON.parse(item);
            } catch {
                return null;
            }
        }).filter(Boolean);
    }

    async getCinemasByType(userId: string, type: 'all' | 'my-rooms' | 'joined' | 'live-now' = 'all') {
        console.log(`🔍 getCinemasByType - userId: ${userId}, type: ${type}`);

        let cinemas: Cinema[] = [];

        switch (type) {
            case 'all':
                // Get all active cinemas
                cinemas = await this.roomRepository.find({
                    where: { isActive: true },
                    relations: ['host'],
                    order: { createdAt: 'DESC' },
                });
                break;

            case 'my-rooms':
                // Get rooms created by this user (host)
                cinemas = await this.roomRepository.find({
                    where: { hostId: userId, isActive: true },
                    relations: ['host'],
                    order: { createdAt: 'DESC' },
                });
                break;

            case 'joined':
                // Get rooms where user is a viewer
                const allRooms = await this.roomRepository.find({
                    where: { isActive: true },
                    relations: ['host'],
                    order: { createdAt: 'DESC' },
                });
                cinemas = allRooms.filter(room =>
                    room.viewerIds.includes(userId) && String(room.hostId) !== String(userId)
                );
                break;

            case 'live-now':
                // Get currently active rooms with users in Redis session
                const allActiveCinemas = await this.roomRepository.find({
                    where: { isActive: true },
                    relations: ['host'],
                    order: { createdAt: 'DESC' },
                });

                // Filter rooms that have active users in Redis
                const liveRooms: Cinema[] = [];
                for (const room of allActiveCinemas) {
                    const users = await this.getRoomUsersWithSocketIds(room.id);
                    if (users.length > 0) {
                        liveRooms.push(room);
                    }
                }
                cinemas = liveRooms;
                break;
        }

        console.log(`✅ Found ${cinemas.length} cinemas for type: ${type}`);
        return cinemas;
    }

    async getUserCurrentRoom(userId: string): Promise<string | null> {
        return await this.redisClient.get(`${this.USER_ROOM_PREFIX}${userId}`);
    }

    async getRoomByCinemaCode(cinemaCode: string): Promise<Cinema> {
        const room = await this.roomRepository.findOne({
            where: { cinemaCode, isActive: true },
        });

        if (!room) {
            throw new NotFoundException(`Room with cinema code ${cinemaCode} not found`);
        }

        return room;
    }

    private async generateUniqueCinemaCode(): Promise<string> {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code: string;
        let isUnique = false;

        while (!isUnique) {
            code = '';
            for (let i = 0; i < 6; i++) {
                code += characters.charAt(Math.floor(Math.random() * characters.length));
            }

            const existingRoom = await this.roomRepository.findOne({
                where: { cinemaCode: code },
            });

            if (!existingRoom) {
                isUnique = true;
            }
        }

        return code!;
    }
}