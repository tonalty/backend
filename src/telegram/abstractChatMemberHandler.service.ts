import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Community } from 'src/data/community.entity';
import { CommunityUser } from 'src/data/communityUser.entity';
import { ChatMemberAdministrator, ChatMemberOwner } from 'telegraf/typings/core/types/typegram';

@Injectable()
export abstract class AbstractChatMemberHandler {
  constructor(
    @InjectModel(Community.name) protected readonly communityModel: Model<Community>,
    @InjectModel(CommunityUser.name) protected readonly communityUserModel: Model<CommunityUser>,
  ) {}

  protected async saveCommunity(chatId: number, title: string) {
    return await this.communityModel.updateOne(
      { chatId: chatId },
      {
        $setOnInsert: {
          chatId: chatId,
          title: title ?? `private-${chatId}`,
          // logic when we calculate jetons here
          remainingPoints: 0,
          threshold: -1,
        },
      },
      { upsert: true }, // create a new document if no documents match the filter
    );
  }

  protected async saveUserCommunity(
    chatId: number,
    userId: number,
    communityName: string,
    admins: (ChatMemberOwner | ChatMemberAdministrator)[],
  ) {
    return await this.communityUserModel.findOneAndUpdate(
      { userId, chatId },
      {
        $setOnInsert: {
          userId: userId,
          chatId,
          points: 0,
          isAdmin: admins.some((owner) => owner.user.id === userId),
        },
        communityName: communityName ?? `private-${chatId}`,
      },
      { upsert: true },
    );
  }
}
