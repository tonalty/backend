import { Community, ReactionTrigger, ReferralTrigger } from 'src/data/community.entity';

export class CommunityDto {
  title: string;
  triggers: {
    referral: ReferralTrigger;
    reaction: ReactionTrigger;
  };
  settings: {
    isTonConnectWallet: boolean;
  };
  members: number;
  comments: number;
  reactions: number;
  type: string;
  photoLink?: string;

  constructor(community: Community) {
    this.title = community.title;
    if (community.triggers) {
      this.triggers = {
        referral: community.triggers.referral,
        reaction: community.triggers.reaction,
      };
    }
    if (community.settings) {
      this.settings = {
        isTonConnectWallet: community.settings.isTonConnectWallet,
      };
    }
    this.members = community.members;
    this.comments = community.comments;
    this.reactions = community.reactions;
    this.photoLink = community.photoLink;
    this.type = community.type ?? 'unknown';
  }
}
