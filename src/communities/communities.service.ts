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

  getUserCommunities(userId: number): Promise<Array<CommunityUser>> {
    // need to check what to do here
    return this.communityUserModel.find({ userId: userId, isAdmin: { $exists: false } }).sort({ points: -1, _id: 1 });
  }

  getAdminCommunities(userId: number): Promise<CommunityUser[]> {
    return this.communityUserModel.find({ userId: userId, isAdmin: true }).sort({ points: -1, _id: 1 });
  }

  getAllCommunities(userId: number) {
    return this.communityUserModel.find({ userId: userId }, {}, { $sort: { points: -1, _id: 1 } });
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
}
