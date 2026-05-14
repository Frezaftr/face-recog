import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ImagesService } from './images.service';
import { PaginationDto } from './dto/pagination.dto';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('images')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('upload')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Upload one or more images (max 10 per request, 50 MB each)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  upload(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: JwtPayload,
  ) {
    return this.imagesService.upload(files, user);
  }

  @Get()
  @ApiOperation({ summary: 'List your uploaded images (paginated)' })
  findAll(@Query() pagination: PaginationDto, @CurrentUser() user: JwtPayload) {
    return this.imagesService.findAll(pagination, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get image by ID, including detected faces' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.imagesService.findOne(id, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete image, faces, and all vector embeddings' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.imagesService.remove(id, user);
  }
}
