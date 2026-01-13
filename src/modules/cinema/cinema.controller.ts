import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
    Patch,
    Query,
} from '@nestjs/common';
import { CinemaService } from './cinema.service';
import {
    CreateRoomDto,
    JoinRoomDto,
    UpdatePlayerStateDto,
    SetPermissionsDto,
} from './dto/cinema.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('cinema')
@UseGuards(AuthGuard)
export class CinemaController {
    constructor(private readonly cinemaService: CinemaService) { }

    @Post('/')
    @HttpCode(HttpStatus.CREATED)
    async createRoom(@Request() req, @Body() createRoomDto: CreateRoomDto) {
        const userId = req.user.id.toString();
        const room = await this.cinemaService.createRoom(userId, createRoomDto);

        return {
            success: true,
            data: room,
            message: 'Room created successfully',
        };
    }

    @Get('/')
    async getAllRooms() {
        const cinemas = await this.cinemaService.getAllActiveRooms();
        return {
            success: true,
            count: cinemas.length,
            data: cinemas,
        };
    }

    @Get('my-cinema')
    async getMyCinema(
        @Request() req,
        @Query('type') type?: 'all' | 'my-rooms' | 'joined' | 'live-now'
    ) {
        const userId = req.user.id.toString();
        const cinemas = await this.cinemaService.getCinemasByType(userId, type || 'my-rooms');
        return {
            success: true,
            count: cinemas.length,
            type: type || 'my-rooms',
            data: cinemas,
        };
    }

    @Get('code/:cinemaCode')
    async getRoomByCinemaCode(@Param('cinemaCode') cinemaCode: string) {
        const room = await this.cinemaService.getRoomByCinemaCode(cinemaCode);
        return {
            success: true,
            data: room,
        };
    }

    @Get(':cinemaId')
    async getRoom(@Param('cinemaId') cinemaId: string) {
        const room = await this.cinemaService.getRoom(cinemaId);
        return {
            success: true,
            data: room,
        };
    }

    @Post(':cinemaId/join')
    @HttpCode(HttpStatus.OK)
    async joinRoom(@Request() req, @Param('cinemaId') cinemaId: string) {
        const userId = req.user.id.toString();
        console.log('🎯 JOIN ROOM API called:', { cinemaId, userId });
        const { room, role } = await this.cinemaService.joinRoom(cinemaId, userId, '');

        return {
            success: true,
            data: { room, role },
            message: `Joined room as ${role}`,
        };
    }

    @Post(':cinemaId/leave')
    @HttpCode(HttpStatus.OK)
    async leaveRoom(@Request() req, @Param('cinemaId') cinemaId: string) {
        const userId = req.user.id.toString();
        await this.cinemaService.leaveRoom(cinemaId, userId);

        return {
            success: true,
            message: 'Left room successfully',
        };
    }

    @Patch(':cinemaId/player')
    @HttpCode(HttpStatus.OK)
    async updatePlayerState(
        @Request() req,
        @Param('cinemaId') cinemaId: string,
        @Body() updateDto: UpdatePlayerStateDto,
    ) {
        const userId = req.user.id.toString();
        updateDto.cinemaId = cinemaId;

        const room = await this.cinemaService.updatePlayerState(cinemaId, userId, updateDto);

        return {
            success: true,
            data: room,
            message: 'Player state updated',
        };
    }

    @Post(':cinemaId/permissions')
    @HttpCode(HttpStatus.OK)
    async setPermissions(
        @Request() req,
        @Param('cinemaId') cinemaId: string,
        @Body() setPermissionsDto: SetPermissionsDto,
    ) {
        const hostId = req.user.id.toString();
        setPermissionsDto.cinemaId = cinemaId;

        const room = await this.cinemaService.setViewerPermissions(
            cinemaId,
            hostId,
            setPermissionsDto.viewerId,
            setPermissionsDto.permissions,
        );

        return {
            success: true,
            data: room,
            message: 'Permissions updated successfully',
        };
    }

    @Delete(':cinemaId/viewers/:viewerId')
    @HttpCode(HttpStatus.OK)
    async kickViewer(
        @Request() req,
        @Param('cinemaId') cinemaId: string,
        @Param('viewerId') viewerId: string,
    ) {
        const hostId = req.user.id.toString();
        await this.cinemaService.kickViewer(cinemaId, hostId, viewerId);

        return {
            success: true,
            message: 'Viewer kicked successfully',
        };
    }


}