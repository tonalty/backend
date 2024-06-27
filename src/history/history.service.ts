import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommunityUserHistory, RewardBuyData } from 'src/data/communityUserHistory.entity';
import { UserHistoryDto } from './UserHistoryDto';
import { Reward } from 'src/data/reward.entity';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(
    @InjectModel(CommunityUserHistory.name) private readonly communityUserHistoryModel: Model<CommunityUserHistory>,
  ) {}

  getUserHistory(userId: number, chatId: number, limit: number): Promise<Array<UserHistoryDto>> {
    return this.communityUserHistoryModel.find(
      { userId: userId, communityId: chatId },
      { _id: 0, communityId: 1, data: 1, createdAt: 1 },
      { limit: limit },
    );
  }

  async createRewardBuyRecord(userId: number, chatId: number, reward: Reward) {
    await this.communityUserHistoryModel.create({
      userId: userId,
      communityId: chatId,
      data: new RewardBuyData(reward),
    });
  }
}
