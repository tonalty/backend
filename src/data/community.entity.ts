import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class Community {
  @Prop()
  chatId: number;

  @Prop()
  title: string;

  @Prop()
  userIds: string[];

  @Prop()
  threshold: number;

  @Prop()
  remainingPoints: number;

  @Prop()
  walletAddress: string;
}
