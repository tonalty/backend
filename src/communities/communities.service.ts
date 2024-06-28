import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Community } from 'src/data/community.entity';
import { CommunityUser } from 'src/data/communityUser.entity';
import { Message } from 'src/data/message.entity';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
    @InjectModel(Community.name) private readonly communityModel: Model<Community>,
    @InjectModel(CommunityUser.name) private readonly communityUserModel: Model<CommunityUser>,
  ) {}

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

  async increaseMemberCounter(chatId: number) {
    await this.communityModel.updateOne({ chatId: chatId }, { $inc: { members: 1 } });
  }

  async decreaseMemberCounter(chatId: number) {
    await this.communityModel.updateOne({ chatId: chatId }, { $inc: { members: -1 } });
  }

  async increaseMessageCounter(chatId: number) {
    await this.communityModel.updateOne({ chatId: chatId }, { $inc: { comments: 1 } });
  }

  async increaseReactionCounter(chatId: number) {
    await this.communityModel.updateOne({ chatId: chatId }, { $inc: { reactions: 1 } });
  }
}
