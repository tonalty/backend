import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommunityUser } from 'src/data/communityUser.entity';
import { Message } from 'src/data/message.entity';

@Injectable()
export class CommunitiesService {
  private readonly logger = new Logger(CommunitiesService.name);

  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
    @InjectModel(CommunityUser.name) private readonly communityUserModel: Model<CommunityUser>,
  ) {}

  getAdminCommunities(userId: number): Promise<CommunityUser[]> {
    return this.communityUserModel.find({ userId: userId, isAdmin: true }).sort({ points: -1, _id: 1 });
  }

  getAllCommunities(userId: number) {
    return this.communityUserModel.find({ userId: userId }).sort({ points: -1, _id: 1 });
  }

  async getUserPoints(userId: number, chatId: number): Promise<number> {
    const result: { points: number }[] = await this.messageModel.aggregate([
      { $match: { creatorUserId: userId, chatId } },
      { $group: { _id: null, points: { $sum: '$points' } } },
      {
        $project: { points: 1 },
      },
    ]);

    return result[0].points;
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
}
