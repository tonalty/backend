import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class Jetton {
  @Prop()
  name: string;

  @Prop()
  symbol: string;

  @Prop()
  tokenToMint: number;

  @Prop()
  description: string;
}
