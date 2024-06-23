import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommunityUserHistory } from 'src/data/communityUserHistory.entity';
import { UserHistoryDto } from './UserHistoryDto';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(
    @InjectModel(CommunityUserHistory.name) private readonly communityUserHistoryModel: Model<CommunityUserHistory>,
  ) {}

  getUserHistory(userId: number, limit: number): Promise<Array<UserHistoryDto>> {
    return this.communityUserHistoryModel.find(
      { userId: userId },
      { _id: 0, communityId: 1, data: 1, createdAt: 1 },
      { limit: limit },
    );
  }
}
