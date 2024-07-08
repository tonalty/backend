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

export interface IReactionTrigger {
  readonly points: number;
  readonly threshold: number;
  readonly isEnabled: boolean;
}
export interface IReferralTrigger {
  readonly inviterPoints: number;
  readonly inviteePoints: number;
  readonly isEnabled: boolean;
}

export interface ITriggers {
  referral: IReferralTrigger;
  reaction: IReactionTrigger;
}

@Schema()
export class Community {
  @Prop({ required: true, index: true })
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

  // TODO: rewrite somehow
  @Prop({ type: mongoose.Schema.Types.Mixed })
  triggers: {
    referral: ReferralTrigger;
    reaction: ReactionTrigger;
  };

  @Prop()
  members: number;

  @Prop()
  comments: number;

  @Prop()
  reactions: number;

  @Prop()
  photoLink: string;

  @Prop()
  inviteLink?: string;
}

export interface Triggers {
  referral: ReferralTrigger;
  reaction: ReactionTrigger;
}
