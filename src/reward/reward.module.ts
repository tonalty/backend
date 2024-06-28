import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { RewardController } from './reward.controller';
import { RewardService } from './reward.service';
import { TempImageModule } from 'src/temp/image/image.module';
import { CommunityModule } from 'src/communities/community.module';
import { HistoryModule } from 'src/history/history.module';

@Module({
  imports: [HttpModule, TempImageModule, CommunityModule, HistoryModule],
  controllers: [RewardController],
  providers: [RewardService],
  exports: [RewardService],
})
export class RewardModule {}
