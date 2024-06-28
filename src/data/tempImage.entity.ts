import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export const EXPIRE_AFTER_SECONDS = 15 * 60;

@Schema({ autoIndex: true })
export class TempImage {
  @Prop()
  extension: string;

  @Prop()
  data: Buffer;

  @Prop({ default: Date.now, expires: EXPIRE_AFTER_SECONDS })
  createdAt: Date;
}

export const TempImageSchema = SchemaFactory.createForClass(TempImage);
