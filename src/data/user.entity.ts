import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class User {
  @Prop()
  userId: number;

  @Prop()
  points: number;
}
