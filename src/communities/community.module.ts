import { Global, Module } from '@nestjs/common';
import { TelegramService } from 'src/telegram/telegram.service';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { CommunityUserService } from './communityUser.service';

@Global()
@Module({
  controllers: [CommunityController],
  providers: [CommunityService, CommunityUserService, TelegramService],
  exports: [CommunityService, CommunityUserService],
})
export class CommunityModule {}
