import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('movies')
export class Movie {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar' })
    external_id: string;

    @Column({ type: 'varchar' })
    slug: string;

    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'varchar' })
    thumb_url: string;

    @Column({ type: 'varchar' })
    poster_url: string;

    @Column({ type: 'varchar' })
    origin_name: string;

    @Column({ type: 'float', nullable: true })
    vote_average: number;

    @Column({ type: 'varchar', nullable: true })
    quality: string;

    @Column({ type: 'varchar', nullable: true })
    type: string;

    @Column({ type: 'int', nullable: true })
    year: number;

    @Column({ type: 'varchar', nullable: true })
    lang: string;

    @Column({ type: 'varchar', nullable: true })
    country: string;

    @Column({ type: 'varchar', nullable: true })
    category: string;

    @ManyToOne(() => User, (user) => user.movies, { eager: true })
    user: User;
}
