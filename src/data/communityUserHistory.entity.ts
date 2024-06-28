import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema } from 'mongoose';
import { Reward } from './reward.entity';

@Schema({ timestamps: true, autoIndex: true })
export class CommunityUserHistory {
  @Prop()
  userId: number;

  @Prop()
  communityId: number;

  @Prop({ default: false, type: MongooseSchema.Types.Mixed })
  data: CommunityUserHistoryData;
}

export const CommunityUserHistorySchema = SchemaFactory.createForClass(CommunityUserHistory);
CommunityUserHistorySchema.index({ userId: 1, communityId: 1, createdAt: -1 });

interface HistoryDataType {
  type: string;
}

export type CommunityUserHistoryData = MessageReactionData | ReferralJoinData | RewardBuyData;

export class MessageReactionData implements HistoryDataType {
  type = 'messageReaction';

  constructor(
    public readonly messageId: Types.ObjectId,
    public readonly chatId: number,
    public readonly points: number,
  ) {}
}

export class ReferralJoinData implements HistoryDataType {
  type = 'referralJoin';
  constructor(
    public readonly userId: number,
    public readonly chatId: number,
    public readonly points: number,
    public readonly username: string,
    public readonly isOwner: boolean,
  ) {}
}

export class RewardBuyData implements HistoryDataType {
  type: 'rewardBuy';
  rewardTitle: string;
  rewardImageUrl: string;
  rewardValue: number;
  rewardDescription: string;
  rewardMessage: string;

  constructor(reward: Reward) {
    this.rewardTitle = reward.title;
    this.rewardImageUrl = reward.imageUrl;
    this.rewardValue = reward.value;
    this.rewardDescription = reward.description;
    this.rewardMessage = reward.rewardMessage;
  }
}
