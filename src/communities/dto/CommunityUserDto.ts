import { CommunityUser } from 'src/data/communityUser.entity';

export class CommunityUserDto {
  communityName: string;
  points: number;
  isAdmin: boolean;

  constructor(communityUser: CommunityUser) {
    this.communityName = communityUser.communityName;
    this.points = communityUser.points;
    this.isAdmin = communityUser.isAdmin;
  }
}
