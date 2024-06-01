import { Prop, Schema } from '@nestjs/mongoose';
import { Jetton } from './jetton.entity';

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

  @Prop()
  jetton: Jetton;
}
