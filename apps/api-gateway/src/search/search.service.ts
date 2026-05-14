import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { SearchLog } from '../database/entities/search-log.entity';
import { StorageService } from '../storage/storage.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { PaginationDto } from '../images/dto/pagination.dto';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

interface VectorSearchRow {
  imageId:          string;
  faceId:           string;
  similarity:       number;
  storageKey:       string;
  originalFilename: string;
  boundingBox:      object;
  createdAt:        Date;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly faceServiceUrl: string;

  constructor(
    @InjectRepository(SearchLog)
    private readonly searchLogRepo: Repository<SearchLog>,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    this.faceServiceUrl = this.configService.getOrThrow<string>('FACE_SERVICE_URL');
  }

  async search(file: Express.Multer.File, query: SearchQueryDto, user: JwtPayload) {
    const start = Date.now();
    const topK  = query.topK ?? 10;

    // 1. Extract 512-dim ArcFace embedding from query image
    const embedding = await this._getEmbedding(file);

    const embeddingHash = crypto
      .createHash('sha256')
      .update(Buffer.from(new Float32Array(embedding).buffer))
      .digest('hex');

    // 2. pgvector HNSW approximate nearest neighbour search
    const matches = await this._vectorSearch(embedding, topK, user);

    // 3. Enrich with signed image URLs
    const results = await Promise.all(
      matches.map(async (m) => ({
        imageId:     m.imageId,
        faceId:      m.faceId,
        similarity:  parseFloat(m.similarity.toFixed(4)),
        boundingBox: m.boundingBox,
        imageUrl:    await this.storageService.presignedUrl(m.storageKey),
        filename:    m.originalFilename,
        createdAt:   m.createdAt,
      })),
    );

    const latencyMs = Date.now() - start;

    // 4. Fire-and-forget audit log — never blocks the response
    this.searchLogRepo
      .save({
        userId:              user.id,
        tenantId:            user.tenantId,
        queryEmbeddingHash:  embeddingHash,
        resultsCount:        results.length,
        latencyMs,
        topK,
      })
      .catch(() => {});

    return { results, total: results.length, latencyMs };
  }

  // ── Private helpers ─────────────────────────────────────────

  private async _getEmbedding(file: Express.Multer.File): Promise<number[]> {
    const form = new FormData();
    form.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);

    try {
      const { data } = await axios.post<{ embedding: number[] }>(
        `${this.faceServiceUrl}/embed`,
        form,
        { timeout: 15_000 },
      );
      return data.embedding;
    } catch (err) {
      this.logger.error('Face service /embed failed', err?.message);
      throw new BadRequestException(
        'Could not extract face embedding from the query image. Ensure it contains exactly one clearly visible face.',
      );
    }
  }

  private async _vectorSearch(
    embedding: number[],
    topK: number,
    user: JwtPayload,
  ): Promise<VectorSearchRow[]> {
    // pgvector cosine distance: <=>
    // similarity = 1 - cosine_distance (range 0–1, higher = more similar)
    const vectorLiteral = `[${embedding.join(',')}]`;

    return this.dataSource.query<VectorSearchRow[]>(
      `
      SELECT
        fe.image_id          AS "imageId",
        fe.face_id           AS "faceId",
        1 - (fe.embedding <=> $1::vector) AS similarity,
        i.storage_key        AS "storageKey",
        i.original_filename  AS "originalFilename",
        f.bounding_box       AS "boundingBox",
        i.created_at         AS "createdAt"
      FROM face_embeddings fe
      JOIN faces  f ON f.id = fe.face_id
      JOIN images i ON i.id = fe.image_id
      WHERE fe.tenant_id = $2
        AND i.status     = 'done'
      ORDER BY fe.embedding <=> $1::vector
      LIMIT $3
      `,
      [vectorLiteral, user.tenantId, topK],
    );
  }

  async getHistory(pagination: PaginationDto, user: JwtPayload) {
    const limit = Math.min(pagination.limit ?? 20, 100);
    const page  = pagination.page ?? 1;

    const [logs, total] = await this.searchLogRepo.findAndCount({
      where:  { userId: user.id, tenantId: user.tenantId },
      order:  { createdAt: 'DESC' },
      take:   limit,
      skip:   (page - 1) * limit,
    });

    return { data: logs, total, page, limit, pages: Math.ceil(total / limit) };
  }
}
