import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class Message {
  @Prop()
  chatId: number;

  @Prop()
  forwardedFromChatId?: number;

  @Prop()
  messageId: number;

  @Prop()
  creatorUserId: number;

  @Prop({ default: 0 })
  points: number;

  @Prop({ default: 0 })
  totalReactionsForMsg: number;
}
