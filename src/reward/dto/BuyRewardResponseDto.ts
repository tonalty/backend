import { Reward } from 'src/data/reward.entity';

export class BuyRewardResponseDto {
  rewardMessage: string;

  constructor(reward: Reward) {
    this.rewardMessage = reward.rewardMessage;
  }
}
