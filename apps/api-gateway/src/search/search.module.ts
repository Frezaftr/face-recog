import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchLog } from '../database/entities/search-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SearchLog])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
