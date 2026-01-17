import { IsArray } from 'class-validator';

export class DeleteMultipleCommentDto {
    @IsArray()
    commentIds: number[];
}
