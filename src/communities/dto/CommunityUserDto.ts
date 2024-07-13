import { Settings } from 'src/data/community.entity';
import { CommunityUser } from 'src/data/communityUser.entity';

export interface ExtendedCommunityUser extends CommunityUser {
  photoLink?: string;
  settings?: Settings;
}

export class CommunityUserDto {
  communityName: string;
  points: number;
  isAdmin: boolean;
  photoLink?: string;
  settings?: Settings;

  constructor(communityUser: ExtendedCommunityUser) {
    this.communityName = communityUser.communityName;
    this.points = communityUser.points;
    this.isAdmin = communityUser.isAdmin;
    this.photoLink = communityUser.photoLink;

    if (communityUser.settings) {
      this.settings = communityUser.settings;
    }
  }
}
