import { CommunityUser } from 'src/data/communityUser.entity';

export interface ExtendedCommunityUser extends CommunityUser {
  photoLink?: string;
}

export class CommunityUserDto {
  communityName: string;
  points: number;
  isAdmin: boolean;
  photoLink?: string;

  constructor(communityUser: ExtendedCommunityUser) {
    this.communityName = communityUser.communityName;
    this.points = communityUser.points;
    this.isAdmin = communityUser.isAdmin;
    this.photoLink = communityUser.photoLink;
  }
}
