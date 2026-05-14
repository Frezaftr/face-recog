import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('search_logs')
export class SearchLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  /** sha256 of the raw embedding bytes — used for cache keying */
  @Column({ name: 'query_embedding_hash', length: 64, nullable: true })
  queryEmbeddingHash: string | null;

  @Column({ name: 'results_count', default: 0 })
  resultsCount: number;

  @Column({ name: 'latency_ms', nullable: true })
  latencyMs: number | null;

  @Column({ name: 'top_k', default: 10 })
  topK: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
