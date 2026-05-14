import {
  Controller,
  Post,
  Get,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { PaginationDto } from '../images/dto/pagination.dto';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('search')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @ApiOperation({ summary: 'Find all images containing a given face (top-K ANN search)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB for query image
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  search(
    @UploadedFile() file: Express.Multer.File,
    @Query() query: SearchQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) throw new BadRequestException('Query image is required');
    return this.searchService.search(file, query, user);
  }

  @Get('history')
  @ApiOperation({ summary: 'Paginated search history for the current user' })
  getHistory(
    @Query() pagination: PaginationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.searchService.getHistory(pagination, user);
  }
}
