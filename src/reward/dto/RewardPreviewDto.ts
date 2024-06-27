import { Types } from 'mongoose';
import { Reward } from 'src/data/reward.entity';

export class RewardPreview {
  id: string;
  imageUrl: string;
  title: string;
  value: number;

  constructor(reward: Reward & { _id: Types.ObjectId }) {
    this.id = reward._id.toHexString();
    this.imageUrl = reward.imageUrl;
    this.title = reward.title;
    this.value = reward.value;
  }
}
