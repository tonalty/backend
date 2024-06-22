import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, autoIndex: true })
export class CommunityUser {
  @Prop()
  userId: number;

  @Prop()
  communityId: number;

  @Prop()
  communityName: string;

  @Prop()
  points: number;

  @Prop()
  isAdmin: boolean;
}

export const CommunityUserSchema = SchemaFactory.createForClass(CommunityUser);
CommunityUserSchema.index({ userId: 1, communityId: 1 });
