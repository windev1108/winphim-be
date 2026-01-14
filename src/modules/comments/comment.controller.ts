import { Controller, Post, Get, Body, UseGuards, Request, Delete, Param, Put } from '@nestjs/common';
import { CommentService } from './comment.service';
import { AddCommentMovieDto } from './dto/add-comment-movie';
import { AuthGuard } from '../auth/auth.guard';

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

    @Get('movie/:movieId')
    async getCommentByMovie(@Param('movieId') movieId: string) {
        const movies = await this.commentService.getCommentByMovie(movieId);
        return { data: movies };
    }
}
