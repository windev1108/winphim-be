import { Controller, Post, Get, Body, UseGuards, Request, Delete, Param, Put } from '@nestjs/common';
import { CommentService } from './comment.service';
import { AddCommentMovieDto } from './dto/add-comment-movie';
import { AuthGuard } from '../auth/auth.guard';
import { DeleteMultipleCommentDto } from './dto/delete-comment-movie';

@Controller('comments')
export class CommentController {
    constructor(private readonly commentService: CommentService) { }

    @Post('')
    @UseGuards(AuthGuard)
    async addCommentMovie(@Request() req, @Body() body: AddCommentMovieDto) {
        const userId = req.user.id.toString();
        const movie = await this.commentService.addComment(userId, body);
        return { data: movie };
    }

    @Delete('/multiple')
    @UseGuards(AuthGuard)
    async deleteMultipleComment(@Body() body: DeleteMultipleCommentDto) {
        const movie = await this.commentService.deleteMultipleComment(body.commentIds);
        return { data: movie };
    }

    @Delete('/:id')
    @UseGuards(AuthGuard)
    async deleteCommentMovie(@Request() req, @Param('id') id: number) {
        const userId = req.user.id.toString();
        const movie = await this.commentService.deleteComment(userId, id);
        return { data: movie };
    }


    @Put('/:id')
    @UseGuards(AuthGuard)
    async updateCommentMovie(@Request() req, @Param('id') id: number) {
        const userId = req.user.id.toString();
        const movie = await this.commentService.deleteComment(userId, id);
        return { data: movie };
    }


    @Get('/mine')
    @UseGuards(AuthGuard)
    async getMyComments(@Request() req) {
        const userId = req.user.id.toString();
        const movie = await this.commentService.getMyComments(userId);
        return { data: movie };
    }

    @Get('movie/:movieSlug')
    async getCommentByMovie(@Param('movieSlug') movieSlug: string) {
        const movies = await this.commentService.getCommentByMovie(movieSlug);
        return { data: movies };
    }
}
