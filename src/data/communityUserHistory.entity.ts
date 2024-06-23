import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema } from 'mongoose';

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

export type CommunityUserHistoryData = MessageReactionData | ReferralJoinData;

export class MessageReactionData implements HistoryDataType {
  type = 'messageReaction';

  constructor(public readonly messageId: Types.ObjectId, public readonly chatId: number) {}
}

export class ReferralJoinData implements HistoryDataType {
  type = 'refferalJoin';
  constructor(public readonly userId: number, public readonly chatId: number) {}
}
