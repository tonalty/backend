import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ autoIndex: true })
export class Reward {
  @Prop({ required: true, index: true })
  chatId: number;

  @Prop()
  imageUrl: string;

  @Prop()
  title: string;

  @Prop({ required: true })
  value: number;

  @Prop()
  description: string;

  @Prop({ required: true })
  rewardMessage: string;

  @Prop({ required: true })
  canBeUsedTimes: number = 1;
}

export const RewardSchema = SchemaFactory.createForClass(Reward);
