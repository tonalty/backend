import { Prop, Schema } from '@nestjs/mongoose';
import { TokenMetadata } from './tokenMetadata.entity';

@Schema()
export class Community {
  @Prop()
  chatId: number;

  @Prop()
  title: string;

  @Prop()
  adminUserIds: string[];

  @Prop()
  threshold: number;

  @Prop()
  remainingPoints: number;

  @Prop()
  walletAddress: string;

  @Prop()
  tokenMetadata: TokenMetadata;
}
