import { Types } from 'mongoose';
import { Reward } from 'src/data/reward.entity';

export class AdminRewardDto {
  imageUrl: string;
  title: string;
  value: number;
  description: string;
  rewardMessage: string;

  constructor(reward: Reward & { _id: Types.ObjectId }) {
    this.imageUrl = reward.imageUrl;
    this.title = reward.title;
    this.value = reward.value;
    this.description = reward.description;
    this.rewardMessage = reward.rewardMessage;
  }
}
