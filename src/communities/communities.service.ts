import { Injectable, Logger } from '@nestjs/common';
import { Community } from '../data/community.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/data/user.entity';
import { Message } from 'src/data/message.entity';
import { UserCommunity } from './interfaces/UserCommunity';

@Injectable()
export class CommunitiesService {
  private readonly logger = new Logger(CommunitiesService.name);

  constructor(
    @InjectModel(Community.name) private readonly communityModel: Model<Community>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
  ) {}

  getUserCommunities(userId: number): Promise<Array<UserCommunity>> {
    return this.messageModel.aggregate([
      { $match: { creatorUserId: userId } },
      { $group: { _id: '$chatId', points: { $sum: '$points' } } },
      {
        $lookup: {
          from: this.communityModel.collection.name,
          localField: '_id',
          foreignField: 'chatId',
          as: 'communities',
        },
      },
      {
        $project: { community: { $arrayElemAt: ['$communities', 0] }, points: 1 },
      },
      {
        $sort: { points: -1, _id: 1 },
      },
    ]);
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

  getAdminCommunities(userId: number): Promise<Community[]> {
    // return this.communityModel.aggregate([{ $match: { adminUserIds: userId } }]);
    return this.communityModel.find({ adminUserIds: userId });
  }
}
