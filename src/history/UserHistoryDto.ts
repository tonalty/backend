import { Date } from 'mongoose';
import { CommunityUserHistoryData } from 'src/data/communityUserHistory.entity';

export interface UserHistoryDto {
  communityId: number;
  data: CommunityUserHistoryData;
  createdAt: Date;
}
