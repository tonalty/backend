import { Prop, Schema } from '@nestjs/mongoose';
import { TokenMetadata } from './tokenMetadata.entity';
import mongoose from 'mongoose';

export class ReactionTrigger {
  public static type = 'reactionTrigger';

  constructor(public readonly points: number, public readonly threshold: number, public readonly isEnabled: boolean) {}
}

export class ReferralTrigger {
  public static type = 'referralTrigger';

  constructor(
    public readonly inviterPoints: number,
    public readonly inviteePoints: number,
    public readonly isEnabled: boolean,
  ) {}
}

@Schema()
export class Community {
  @Prop()
  chatId: number;

  @Prop()
  title: string;

  @Prop()
  adminUserIds: string[];

  @Prop()
  walletAddress: string;

  @Prop()
  tokenMetadata: TokenMetadata;

  @Prop()
  tokenAddress?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  triggers: {
    referral: ReferralTrigger;
    reaction: ReactionTrigger;
  };
}

export interface Triggers {
  referral: ReferralTrigger;
  reaction: ReactionTrigger;
}
