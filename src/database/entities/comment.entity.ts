import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('comments')
export class Comment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar' })
    movieThumbnail: string;

    @Column({ type: 'varchar' })
    movieSlug: string;

    @Column({ type: 'varchar' })
    movieName: string;

    @Column({ type: 'varchar', nullable: true })
    content: string;

    @Column({ type: 'float' })
    rating: number;

    @ManyToOne(() => User, (user) => user.comments)
    user: User;
}