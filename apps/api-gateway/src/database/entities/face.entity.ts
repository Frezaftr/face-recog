import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Image } from './image.entity';

@Entity('faces')
export class Face {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'image_id', type: 'uuid' })
  @Index()
  imageId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  /**
   * Bounding box produced by RetinaFace detector.
   * { x, y, width, height, confidence }
   */
  @Column({ name: 'bounding_box', type: 'jsonb' })
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
  };

  /** 5-point facial landmarks [[x,y], ...] from RetinaFace */
  @Column({ name: 'landmarks', type: 'jsonb', nullable: true })
  landmarks: number[][] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Image, (image) => image.faces)
  @JoinColumn({ name: 'image_id' })
  image: Image;
}
