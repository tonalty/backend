import { Global, Module } from '@nestjs/common';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { CommunityUserService } from 'src/communities/communityUser.service';

@Global()
@Module({
  controllers: [HistoryController],
  providers: [HistoryService, CommunityUserService],
  exports: [HistoryService],
})
export class HistoryModule {}
