import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TempImageController } from './image.controller';
import { TempImageService } from './image.service';

@Module({
  imports: [HttpModule],
  controllers: [TempImageController],
  providers: [TempImageService],
  exports: [TempImageService],
})
export class TempImageModule {}
