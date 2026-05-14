import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { Image } from '../database/entities/image.entity';
import { Face } from '../database/entities/face.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Image, Face])],
  controllers: [ImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
