import { Community } from 'src/data/community.entity';
import { CommunityUser } from 'src/data/communityUser.entity';

export class CommunityUserWithChatPhotoLinkDto {
  userId: number;
  chatId: number;
  communityName: string;
  points: number;
  isAdmin: boolean;
  photoLink?: string;

  constructor(communityUser: CommunityUser, community: Community) {
    this.userId = communityUser.userId;
    this.chatId = communityUser.chatId;
    this.communityName = community.title;
    this.points = communityUser.points;
    this.isAdmin = communityUser.isAdmin;
    this.photoLink = community.photoLink;
  }
}
