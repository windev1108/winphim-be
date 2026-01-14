import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddCommentMovieDto } from './dto/add-comment-movie';
import { Comment } from 'src/database/entities/comment.entity';
import { EditCommentMovieDto } from './dto/edit-comment-movie';

@Injectable()
export class CommentService {
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepo: Repository<Comment>,
    ) { }

    async addComment(userId: number, data: AddCommentMovieDto) {
        const movieExist = await this.commentRepo.findOne({ where: { user: { id: userId } } });
        if (movieExist) {
            throw new BadRequestException('Bạn đã bình luận phim này rồi!');
        }
        const movie = this.commentRepo.create({ user: { id: userId }, ...data });
        return await this.commentRepo.save(movie);
    }

    async deleteComment(userId: number, commentId: number) {
        return await this.commentRepo.delete({ user: { id: userId }, id: commentId });
    }

    async updateComment(movieId: string, data: EditCommentMovieDto) {
        return await this.commentRepo.update(movieId, { ...data });
    }

    async getCommentByMovie(movieId: string) {
        return this.commentRepo.find({ where: { movieId }, relations: { user: true } });
    }
}
