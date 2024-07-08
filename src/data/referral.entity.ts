import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class Referral {
  @Prop()
  chatId: number;

  @Prop({ required: true })
  ownerId: number;

  @Prop()
  ownerName: string;

  @Prop()
  link: string;

  @Prop({ default: [] })
  visitorIds: number[];
}
