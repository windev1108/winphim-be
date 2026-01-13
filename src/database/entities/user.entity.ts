import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Movie } from './movie.entity';
import { Cinema } from './cinema.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', nullable: true })
    googleId: string | null;

    @Column({ type: 'varchar', unique: true })
    email: string;

    @Column({ type: 'varchar', nullable: true })
    firstName: string;

    @Column({ type: 'varchar', nullable: true })
    lastName: string;

    @Column({ type: 'varchar', nullable: true })
    avatar: string;

    @Column({ type: 'varchar', nullable: true, select: false })
    password: string | null;

    @Column({ type: 'enum', enum: ['local', 'google'], default: 'local' })
    provider: 'local' | 'google';

    @OneToMany(() => Movie, (movie) => movie.user)
    movies: Movie[];

    @OneToMany(() => Cinema, (room) => room.host)
    hostedRooms: Cinema[];
}