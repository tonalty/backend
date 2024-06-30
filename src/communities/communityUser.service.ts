import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult } from 'mongodb';
import { Model } from 'mongoose';
import { CommunityUser } from 'src/data/communityUser.entity';
import { CommunityService } from './community.service';

@Injectable()
export class CommunityUserService {
  private readonly logger = new Logger(CommunityUserService.name);

  constructor(
    @InjectModel(CommunityUser.name) private readonly communityUserModel: Model<CommunityUser>,
    private readonly communityService: CommunityService,
  ) {}

  getAdminCommunities(userId: number): Promise<CommunityUser[]> {
    return this.communityUserModel.find({ userId: userId, isAdmin: true }).sort({ points: -1, _id: 1 });
  }

  getAllCommunities(userId: number) {
    return this.communityUserModel.find({ userId: userId }).sort({ points: -1, _id: 1 });
  }

  async getCommunityUser(userId: number, chatId: number): Promise<CommunityUser> {
    const communityUser = await this.communityUserModel.findOne({ userId: userId, chatId: chatId });
    if (!communityUser) {
      throw new Error(`User with id ${userId} does not exist in community ${chatId}`);
    }
    return communityUser;
  }

  async validateCommunityUserPresent(userId: number, chatId: number) {
    await this.getCommunityUser(userId, chatId);
  }

  async validateUserIsAdmin(userId: number, chatId: number) {
    const communityUser = await this.getCommunityUser(userId, chatId);
    if (!communityUser.isAdmin) {
      throw new Error(`User with id ${userId} is not admin`);
    }
  }

  async decreaseCommunityUserPoints(
    userId: number,
    chatId: number,
    pointsToSubtract: number,
  ): Promise<CommunityUser | null> {
    this.logger.log(`Attempting to decrease communityUser<${chatId}, ${userId}> by ${pointsToSubtract}`);
    const result = await this.communityUserModel.findOneAndUpdate(
      { userId: userId, chatId: chatId, $expr: { $gte: ['$points', pointsToSubtract] } },
      {
        $inc: { points: -1 * pointsToSubtract },
      },
    );
    if (result) {
      this.logger.log('The decrease was successful');
      return result;
    } else {
      this.logger.log('The decrease failed');
      return result;
    }
  }

  async deleteCommunityUser(chatId: number, userId: number): Promise<DeleteResult> {
    const result = await this.communityUserModel.deleteOne({ chatId, userId });
    this.communityService.decreaseMemberCounter(chatId);
    return result;
  }
}
