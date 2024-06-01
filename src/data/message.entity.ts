import { Prop, Schema } from '@nestjs/mongoose';

export class Reaction {
  @Prop()
  userId?: number;

  @Prop()
  emoji: string;

  @Prop()
  type: string;
}

@Schema()
export class Message {
  @Prop()
  chatId: number;

  @Prop()
  messageId: number;

  @Prop()
  creatorUserId: number;

  @Prop()
  creatorUserName: string;

  @Prop()
  creatorFirstName: string;

  @Prop({ default: 0 })
  points: number;

  @Prop({ default: [] })
  reactions!: Reaction[];

  @Prop({ default: 0 })
  totalReactionsForMsg: number;
}
