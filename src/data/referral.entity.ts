import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class Referral {
  @Prop()
  chatId: number;

  @Prop()
  ownerId: number;

  @Prop()
  visitorId?: number;

  @Prop()
  link: string;

  @Prop()
  inviteLink: string;

  @Prop()
  isActivated: boolean;
}
