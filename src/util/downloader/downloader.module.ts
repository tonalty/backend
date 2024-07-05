import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DownloaderService } from './downloader.service';

@Module({
  imports: [HttpModule],
  providers: [DownloaderService],
  exports: [DownloaderService],
})
export class DownloaderModule {}
