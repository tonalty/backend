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
}

export const RewardSchema = SchemaFactory.createForClass(Reward);
