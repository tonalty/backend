import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class TokenMetadata {
  @Prop()
  name?: string;

  @Prop()
  description?: string;

  @Prop()
  image?: string;

  @Prop()
  symbol?: string;
}
