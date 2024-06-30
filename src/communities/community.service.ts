import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Community, Triggers } from 'src/data/community.entity';
import { CommunityUser } from 'src/data/communityUser.entity';
import { Message } from 'src/data/message.entity';
import { CommunityDto } from './dto/CommunityDto';

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

  async getCommunity(chatId: number): Promise<CommunityDto> {
    const result = await this.communityModel.findOne({ chatId: chatId });
    if (!result) {
      throw new NotFoundException(`Unable to find community with id ${chatId}`);
    }
    return new CommunityDto(result);
  }

  async getCommunityTitle(chatId: number): Promise<string> {
    const result = await this.communityModel.findOne({ chatId: chatId }, { title: 1 });
    if (!result) {
      throw new NotFoundException(`Unable to find community with id ${chatId}`);
    }
    return result.title;
  }

  async createOrUpdateCommunity(chatId: number, title: string, triggers: Triggers, chatMemberCount: number) {
    try {
      // create
      return await this.communityModel.updateOne(
        { chatId: chatId },
        {
          $setOnInsert: {
            chatId: chatId,
            title: title ?? `private-${chatId}`,
            triggers,
            comments: 0,
            reactions: 0,
          },
          $set: {
            members: chatMemberCount,
          },
        },
        { upsert: true }, // create a new document if no documents match the filter
      );
    } catch (error) {
      throw new Error(error);
    }
  }
}
