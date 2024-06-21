import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class Referral {
  @Prop()
  chatId: number;

  @Prop({ required: true })
  ownerId: number;

  @Prop()
  link: string;

  @Prop()
  inviteLink: string;

  @Prop({ default: [] })
  visitorIds: number[];
}
