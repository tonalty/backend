import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import { CommunityUser } from 'src/data/communityUser.entity';
import { ChatMember } from 'telegraf/typings/core/types/typegram';
import { CommunityService } from './community.service';
import { CommunityUserDto } from './dto/CommunityUserDto';
import { CommunityUserWithChatPhotoLinkDto } from './dto/CommunityUserWithChatPhotoLinkDto';

@Injectable()
export class CommunityUserService {
  private readonly logger = new Logger(CommunityUserService.name);

  constructor(
    @InjectModel(CommunityUser.name) private readonly communityUserModel: Model<CommunityUser>,
    private readonly communityService: CommunityService,
  ) {}

  async getAdminCommunities(userId: number): Promise<CommunityUserWithChatPhotoLinkDto[]> {
    const communityUserAndCommunity = await this.communityUserModel
      .aggregate([
        {
          $match: { userId: userId, isAdmin: true },
        },
        {
          $lookup: {
            from: 'communities',
            localField: 'chatId',
            foreignField: 'chatId',
            as: 'community',
          },
        },
      ])
      .sort({ createdAt: -1 });
    return communityUserAndCommunity.map(
      (entity) => new CommunityUserWithChatPhotoLinkDto(entity, entity.community[0]),
    );
  }

  async getAllCommunities(userId: number): Promise<CommunityUserWithChatPhotoLinkDto[]> {
    const communityUserAndCommunity = await this.communityUserModel
      .aggregate([
        {
          $match: { userId: userId },
        },
        {
          $lookup: {
            from: 'communities',
            localField: 'chatId',
            foreignField: 'chatId',
            as: 'community',
          },
        },
      ])
      .sort({ createdAt: -1 });
    return communityUserAndCommunity.map(
      (entity) => new CommunityUserWithChatPhotoLinkDto(entity, entity.community[0]),
    );
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

  async deleteAllCommunityUserWithChatId(chatId: number): Promise<DeleteResult> {
    return await this.communityUserModel.deleteMany({ chatId });
  }

  async createOrUpdateCommunityUser(userId: number, chatId: number, isAdmin: boolean): Promise<CommunityUserDto> {
    const communityTitle = await this.communityService.getCommunityTitle(chatId);
    const result = await this.communityUserModel
      .findOneAndUpdate(
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
      )
      .lean();

    const community = await this.communityService.getCommunity(chatId);

    this.logger.log(`Created or updated a new community user. userId: ${userId}, chatId ${chatId}`);

    return new CommunityUserDto(Object.assign({}, { ...result, photoLink: community.photoLink }));
  }

  isChatMemberAdmin(chatMember: ChatMember): boolean {
    return chatMember.status == 'creator' || chatMember.status == 'administrator';
  }

  async updateCommunityUserId(oldChatId: number, newChatId: number) {
    await this.communityUserModel.updateMany({ chatId: oldChatId }, { $set: { chatId: newChatId } });
  }
}
