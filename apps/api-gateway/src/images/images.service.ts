import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Image, ImageStatus } from '../database/entities/image.entity';
import { StorageService } from '../storage/storage.service';
import { KafkaService } from '../kafka/kafka.service';
import { PaginationDto } from './dto/pagination.dto';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    @InjectRepository(Image)
    private readonly imageRepo: Repository<Image>,
    private readonly storageService: StorageService,
    private readonly kafkaService: KafkaService,
  ) {}

  async upload(files: Express.Multer.File[], user: JwtPayload) {
    if (!files?.length) throw new BadRequestException('No files provided');

    const results = await Promise.all(
      files.map((f) => this._processSingleUpload(f, user)),
    );
    return { uploaded: results.length, images: results };
  }

  private async _processSingleUpload(
    file: Express.Multer.File,
    user: JwtPayload,
  ) {
    // Sanitise filename — prevent path traversal
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename   = `${uuidv4()}-${safeName}`;
    const storageKey = `${user.tenantId}/${user.id}/${filename}`;

    // 1. Stream to MinIO
    await this.storageService.putObject(storageKey, file.buffer, file.mimetype);

    // 2. Persist metadata
    const image = this.imageRepo.create({
      userId:           user.id,
      tenantId:         user.tenantId,
      filename,
      originalFilename: file.originalname,
      storageKey,
      mimeType:         file.mimetype,
      fileSize:         file.size,
      status:           ImageStatus.PENDING,
    });
    const saved = await this.imageRepo.save(image);

    // 3. Publish event — worker will detect faces asynchronously
    await this.kafkaService.publish('image.uploaded', {
      imageId:    saved.id,
      storageKey: saved.storageKey,
      userId:     saved.userId,
      tenantId:   saved.tenantId,
    });

    this.logger.log(`Queued image ${saved.id} for face processing`);
    return { id: saved.id, status: saved.status, filename: saved.filename };
  }

  async findAll(pagination: PaginationDto, user: JwtPayload) {
    const limit = Math.min(pagination.limit ?? 20, 100);
    const page  = pagination.page ?? 1;

    const [images, total] = await this.imageRepo.findAndCount({
      where:  { userId: user.id, tenantId: user.tenantId },
      order:  { createdAt: 'DESC' },
      take:   limit,
      skip:   (page - 1) * limit,
    });

    const data = await Promise.all(
      images.map(async (img) => ({
        ...img,
        url: await this.storageService.presignedUrl(img.storageKey),
      })),
    );

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string, user: JwtPayload) {
    const image = await this.imageRepo.findOne({
      where:     { id, userId: user.id, tenantId: user.tenantId },
      relations: ['faces'],
    });
    if (!image) throw new NotFoundException('Image not found');

    const url = await this.storageService.presignedUrl(image.storageKey);
    return { ...image, url };
  }

  async remove(id: string, user: JwtPayload) {
    const image = await this.imageRepo.findOne({
      where: { id, userId: user.id, tenantId: user.tenantId },
    });
    if (!image) throw new NotFoundException('Image not found');

    // Remove from object storage
    await this.storageService.removeObject(image.storageKey);

    // DB cascade deletes faces + face_embeddings via FK constraints
    await this.imageRepo.remove(image);

    this.logger.log(`Deleted image ${id} and all associated data`);
  }
}
