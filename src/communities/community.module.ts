import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { TelegramService } from 'src/telegram/telegram.service';
import { DownloaderService } from 'src/util/downloader/downloader.service';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { CommunityUserService } from './communityUser.service';

@Global()
@Module({
  imports: [HttpModule],
  controllers: [CommunityController],
  providers: [CommunityService, CommunityUserService, TelegramService, DownloaderService],
  exports: [CommunityService, CommunityUserService],
})
export class CommunityModule {}
