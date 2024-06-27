import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { RewardController } from './reward.controller';
import { RewardService } from './reward.service';
import { TempImageModule } from 'src/temp/image/image.module';

@Module({
  imports: [HttpModule, TempImageModule],
  controllers: [RewardController],
  providers: [RewardService],
  exports: [RewardService],
})
export class RewardModule {}
