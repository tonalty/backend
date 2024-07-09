import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, autoIndex: true })
export class CommunityUser {
  @Prop()
  userId: number;

  @Prop()
  chatId: number;

  @Prop()
  communityName: string;

  @Prop()
  points: number;

  @Prop()
  isAdmin: boolean;
}

export const CommunityUserSchema = SchemaFactory.createForClass(CommunityUser);
CommunityUserSchema.index({ userId: 1, chatId: 1 }, { unique: true });
