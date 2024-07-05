import { Community, ReactionTrigger, ReferralTrigger } from 'src/data/community.entity';

export class CommunityDto {
  title: string;
  triggers: {
    referral: ReferralTrigger;
    reaction: ReactionTrigger;
  };
  members: number;
  comments: number;
  reactions: number;
  photoLink?: string;

  constructor(community: Community) {
    this.title = community.title;
    if (community.triggers) {
      this.triggers = {
        referral: community.triggers.referral,
        reaction: community.triggers.reaction,
      };
    }
    this.members = community.members;
    this.comments = community.comments;
    this.reactions = community.reactions;
    this.photoLink = community.photoLink;
  }
}
