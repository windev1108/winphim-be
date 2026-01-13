import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum UserRole {
    HOST = 'host',
    VIEWER = 'viewer',
}

export enum ViewerPermission {
    CAN_PLAY = 'can_play',
    CAN_PAUSE = 'can_pause',
    CAN_SEEK = 'can_seek',
    CAN_CHANGE_VOLUME = 'can_change_volume',
}

@Entity('cinema')
export class Cinema {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true, length: 6 })
    cinemaCode: string;

    @Column()
    movieUrl: string;

    @Column({ nullable: true })
    movieTitle: string;

    @Column()
    hostId: string;

    @ManyToOne(() => User, (user) => user.hostedRooms, { eager: true })
    @JoinColumn({ name: 'hostId' })
    host: User;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    currentTime: number;

    @Column({ default: false })
    isPlaying: boolean;

    @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
    playbackRate: number;

    @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
    volume: number;

    @Column({ default: 100 })
    capacity: number;

    @Column('simple-array', { default: '' })
    viewerIds: string[];

    @Column('simple-json', { default: '{}' })
    viewerPermissions: Record<string, ViewerPermission[]>;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}