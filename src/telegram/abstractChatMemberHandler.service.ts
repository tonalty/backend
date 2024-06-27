import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Community, Triggers } from 'src/data/community.entity';
import { CommunityUser } from 'src/data/communityUser.entity';
import { ChatMemberAdministrator, ChatMemberOwner } from 'telegraf/typings/core/types/typegram';

@Injectable()
export abstract class AbstractChatMemberHandler {
  protected readonly logger = new Logger(AbstractChatMemberHandler.name);

  constructor(
    @InjectModel(Community.name) protected readonly communityModel: Model<Community>,
    @InjectModel(CommunityUser.name) protected readonly communityUserModel: Model<CommunityUser>,
  ) {}

  protected async saveCommunity(chatId: number, title: string, triggers: Triggers) {
    try {
      // create
      return await this.communityModel.updateOne(
        { chatId: chatId },
        {
          $setOnInsert: {
            chatId: chatId,
            title: title ?? `private-${chatId}`,
            triggers,
          },
        },
        { upsert: true }, // create a new document if no documents match the filter
      );
    } catch (error) {
      throw new Error(error);
    }
  }

  protected async saveUserCommunity(
    chatId: number,
    userId: number,
    communityName: string,
    admins: (ChatMemberOwner | ChatMemberAdministrator)[],
  ) {
    this.logger.log('saveUserCommunity');
    this.logger.log('chatId', chatId);
    this.logger.log('userId', userId);
    this.logger.log('communityName', communityName);
    this.logger.log('admins', admins);

    try {
      return await this.communityUserModel.findOneAndUpdate(
        { userId, chatId },
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
    } catch (error) {
      throw new Error(error);
    }
  }
}
