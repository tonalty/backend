import { ReactionTrigger, ReferralTrigger } from 'src/data/community.entity';

export interface TriggersDto {
  chatId: number;
  triggers: {
    referral: ReferralTrigger;
    reaction: ReactionTrigger;
  };
}
