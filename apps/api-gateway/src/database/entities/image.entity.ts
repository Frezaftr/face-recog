import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Face } from './face.entity';

export enum ImageStatus {
  PENDING    = 'pending',
  PROCESSING = 'processing',
  DONE       = 'done',
  FAILED     = 'failed',
}

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ length: 255 })
  filename: string;

  @Column({ name: 'original_filename', length: 500 })
  originalFilename: string;

  @Column({ name: 'storage_key', length: 500 })
  storageKey: string;

  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @Column({ name: 'file_size', type: 'bigint', default: 0 })
  fileSize: number;

  @Column({ type: 'enum', enum: ImageStatus, default: ImageStatus.PENDING })
  @Index()
  status: ImageStatus;

  @Column({ name: 'face_count', default: 0 })
  faceCount: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.images)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Face, (face) => face.image)
  faces: Face[];
}
