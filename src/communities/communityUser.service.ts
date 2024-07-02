import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import { CommunityUser } from 'src/data/communityUser.entity';
import { CommunityService } from './community.service';
import { CommunityUserDto } from './dto/CommunityUserDto';
import { ChatMember } from 'telegraf/typings/core/types/typegram';

@Injectable()
export class CommunityUserService {
  private readonly logger = new Logger(CommunityUserService.name);

  constructor(
    @InjectModel(CommunityUser.name) private readonly communityUserModel: Model<CommunityUser>,
    private readonly communityService: CommunityService,
  ) {}

  getAdminCommunities(userId: number): Promise<CommunityUser[]> {
    return this.communityUserModel.find({ userId: userId, isAdmin: true }).sort({ updatedAt: -1 });
  }

  getAllCommunities(userId: number) {
    return this.communityUserModel.find({ userId: userId }).sort({ updatedAt: -1 });
  }

  getCommunityUser(userId: number, chatId: number): Promise<(CommunityUser & { _id: Types.ObjectId }) | null> {
    return this.communityUserModel.findOne({ userId: userId, chatId: chatId });
  }

  async validateCommunityUserPresent(userId: number, chatId: number) {
    const communityUser = await this.getCommunityUser(userId, chatId);
    if (!communityUser) {
      throw new Error(`User with id ${userId} does not exist in community ${chatId}`);
    }
  }

  async validateUserIsAdmin(userId: number, chatId: number) {
    const communityUser = await this.getCommunityUser(userId, chatId);
    if (communityUser && !communityUser.isAdmin) {
      throw new Error(`User with id ${userId} is not admin`);
    }
  }

  async decreaseCommunityUserPoints(
    userId: number,
    chatId: number,
    pointsToSubtract: number,
  ): Promise<(CommunityUser & { _id: Types.ObjectId }) | null> {
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

  async createOrUpdateCommunityUser(userId: number, chatId: number, isAdmin: boolean): Promise<CommunityUserDto> {
    const communityTitle = await this.communityService.getCommunityTitle(chatId);
    const result = await this.communityUserModel.findOneAndUpdate(
      { userId: userId, chatId: chatId },
      {
        $setOnInsert: {
          userId: userId,
          chatId: chatId,
          communityName: communityTitle,
          points: 0,
        },
        $set: {
          // $set happens if the document is found and if it's not found
          isAdmin: isAdmin,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );
    this.logger.log(`Created or updated a new community user. userId: ${userId}, chatId ${chatId}`);
    return new CommunityUserDto(result);
  }

  isChatMemberAdmin(chatMember: ChatMember): boolean {
    return chatMember.status == 'creator' || chatMember.status == 'administrator';
  }

  async updateCommunityUserId(oldChatId: number, newChatId: number) {
    await this.communityUserModel.updateMany({ chatId: oldChatId }, { $set: { chatId: newChatId } });
  }
}
