import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CommunityUserHistory, RewardBuyData } from 'src/data/communityUserHistory.entity';
import { UserHistoryDto } from './UserHistoryDto';
import { Reward } from 'src/data/reward.entity';
import { CommunityUser } from 'src/data/communityUser.entity';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(
    @InjectModel(CommunityUserHistory.name) private readonly communityUserHistoryModel: Model<CommunityUserHistory>,
  ) {}

  getUserHistory(
    communityUser: CommunityUser & { _id: Types.ObjectId },
    limit: number,
  ): Promise<Array<UserHistoryDto>> {
    return this.communityUserHistoryModel.find(
      { communityUserId: communityUser._id },
      { _id: 0, communityId: 1, data: 1, createdAt: 1 },
      { limit: limit },
    );
  }

  async createRewardBuyRecord(communityUser: CommunityUser & { _id: Types.ObjectId }, reward: Reward) {
    await this.communityUserHistoryModel.create({
      communityUserId: communityUser._id,
      data: new RewardBuyData(reward, -communityUser.points),
    });
  }
}
