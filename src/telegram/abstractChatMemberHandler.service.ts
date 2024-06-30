import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommunityService } from 'src/communities/community.service';
import { Community } from 'src/data/community.entity';
import { CommunityUser } from 'src/data/communityUser.entity';
import { ChatMemberAdministrator, ChatMemberOwner } from 'telegraf/typings/core/types/typegram';

@Injectable()
export abstract class AbstractChatMemberHandler {
  protected readonly logger = new Logger(AbstractChatMemberHandler.name);

  constructor(
    @InjectModel(Community.name) protected readonly communityModel: Model<Community>,
    @InjectModel(CommunityUser.name) protected readonly communityUserModel: Model<CommunityUser>,
    protected readonly communityService: CommunityService,
  ) {}

  protected async createCommunityUserIfNoExist(
    chatId: number,
    userId: number,
    communityName: string,
    admins: (ChatMemberOwner | ChatMemberAdministrator)[],
  ) {
    this.logger.log('createCommunityUserIfNoExist');
    this.logger.log('chatId', chatId);
    this.logger.log('userId', userId);
    this.logger.log('communityName', communityName);
    this.logger.log('admins', admins);

    try {
      const result = await this.communityUserModel.updateOne(
        { userId: userId, chatId: chatId },
        {
          $setOnInsert: {
            userId: userId,
            chatId,
            points: 0,
            isAdmin: admins.some((owner) => owner.user.id === userId),
            communityName: communityName ?? `private-${chatId}`,
          },
        },
        { upsert: true },
      );
      if (result.upsertedCount) {
        this.logger.log(`Adding new comunity user with id ${userId} and chatId ${chatId}`);
        this.communityService.increaseMemberCounter(chatId);
      }
    } catch (error) {
      throw new Error(error);
    }
  }
}
