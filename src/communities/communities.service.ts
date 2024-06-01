import { Injectable, Logger } from '@nestjs/common';
import { Community } from '../data/community.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/data/user.entity';
import { Message } from 'src/data/message.entity';

@Injectable()
export class CommunitiesService {
  private readonly logger = new Logger(CommunitiesService.name);

  constructor(
    @InjectModel(Community.name) private readonly communityModel: Model<Community>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
  ) {}

  getUserCommunities(userId: number): Promise<Array<Community>> {
    return this.messageModel.aggregate([
      { $match: { creatorUserId: userId } },
      { $group: { _id: '$chatId', points: { $sum: '$points' } } },
      {
        $lookup: {
          localField: '_id',
          from: this.communityModel.collection.name,
          foreignField: 'chatId',
          as: 'communities',
        },
      },
      {
        $project: { community: { $arrayElemAt: ['$communities', 0] }, points: 1 },
      },
    ]);
    //   { $match: { userId } },
    //   {
    //     $lookup: {
    //       localField: 'userId',
    //       from: this.messageModel.collection.name,
    //       foreignField: 'creatorUserId',
    //       as: 'messages',
    //     },
    //   },
    //   {
    //     $unwind: { path: '$messages' },
    //   },
    //   {
    //     $lookup: {
    //       localField: 'messages.chatId',
    //       from: this.communityModel.collection.name,
    //       foreignField: 'chatId',
    //       as: 'communities',
    //     },
    //   },
    //   {
    //     $project: { community: '$communities' },
    //   },
    // ]);
  }

  // async createCommunity(communityDto: CommunityDto): Promise<Community> {
  //   try {
  //     return await this.communityRepository.insertOne(communityDto);
  //   } catch (error) {
  //     this.logger.error(error);
  //   }
  // }
}
