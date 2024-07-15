import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import { join } from 'path';
import { PUBLIC_COMMUNITY_AVATAR_ENDPOINT, PUBLIC_FS_COMMUNITY_AVATAR_DIRECTORY } from 'src/app.module';
import { UpdateSettingsDto } from 'src/communities/dto/UpdateSettingsDto';
import { Community, Settings, Triggers } from 'src/data/community.entity';
import { CommunityUser } from 'src/data/communityUser.entity';
import { Message } from 'src/data/message.entity';
import { TelegramService } from 'src/telegram/telegram.service';
import { DownloaderService } from 'src/util/downloader/downloader.service';
import { URL } from 'url';
import { CommunityDto } from './dto/CommunityDto';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);
  private readonly serverOrigin;

  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
    @InjectModel(Community.name) private readonly communityModel: Model<Community>,
    @InjectModel(CommunityUser.name) private readonly communityUserModel: Model<CommunityUser>,
    private readonly telegramService: TelegramService,
    private readonly downloaderService: DownloaderService,
    configService: ConfigService,
  ) {
    this.serverOrigin = configService.getOrThrow('SERVER_ORIGIN').replace(/\/$/, '');
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

  async createOrUpdateCommunity(
    chatId: number,
    chatType: string,
    title: string,
    triggers: Triggers,
    settings: Settings,
    chatMemberCount: number,
    inviteLink?: string,
  ) {
    try {
      // create
      const response = await this.communityModel.findOneAndUpdate(
        { chatId: chatId },
        {
          $setOnInsert: {
            chatId: chatId,
            title: title ?? `private-${chatId}`,
            triggers,
            settings,
            comments: 0,
            reactions: 0,
            inviteLink,
            type: chatType,
          },
          $set: {
            members: chatMemberCount,
          },
        },
        { upsert: true, projection: { _id: 1 }, new: true }, // create a new document if no documents match the filter
      );
      this.logger.log(`Added or updated community with id ${chatId}`);
      if (!response.photoLink) {
        const telegramAvatarUrl = await this.telegramService.getCommunityPhotoDownloadLink(chatId);
        if (telegramAvatarUrl) {
          await this.updateCommunityAvatar(response._id, chatId, telegramAvatarUrl);
        } else {
          this.logger.log(`Unable to get download link for chat ${chatId} photo`);
        }
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  private async updateCommunityAvatar(communityId: Types.ObjectId, chatId: number, telegramAvatarUrl: URL) {
    const imageFilename = `${communityId.toHexString()}.png`;
    const downloadPath = join(PUBLIC_FS_COMMUNITY_AVATAR_DIRECTORY, imageFilename);
    const avatarUrl = this.serverOrigin + join(PUBLIC_COMMUNITY_AVATAR_ENDPOINT, imageFilename);
    const isDownloadSuccess = await this.downloaderService.downloadFileTo(telegramAvatarUrl, downloadPath);
    if (isDownloadSuccess) {
      await this.communityModel.updateOne({ chatId: chatId }, { $set: { photoLink: avatarUrl } });
      this.logger.log(`Successfully updated avatar for chat ${chatId}`);
    } else {
      this.logger.error(`Unable to download avatar for chat ${chatId}`);
    }
  }

  async updateCommunityAvatarByChatId(chatId: number, telegramAvatarUrl: URL) {
    const community = await this.communityModel.findOne({ chatId: chatId }, { _id: 1 });
    if (community) {
      await this.updateCommunityAvatar(community._id, chatId, telegramAvatarUrl);
    } else {
      throw new NotFoundException(`Unable to find community by id ${chatId}`);
    }
  }

  async updateCommunityId(oldChatId: number, newChatId: number) {
    await this.communityModel.updateOne({ chatId: oldChatId }, { $set: { chatId: newChatId } });
  }

  async updateInviteLink(chatId: number, inviteLink: string) {
    return await this.communityModel.updateOne({ chatId }, { inviteLink });
  }

  async deleteCommunity(chatId: number): Promise<DeleteResult> {
    return await this.communityModel.deleteOne({ chatId: chatId });
  }

  async updateSettings(updateSettings: UpdateSettingsDto): Promise<boolean> {
    try {
      this.logger.log('updateSettings: ', JSON.stringify(updateSettings));
      const {
        settings: { isTonConnectWallet },
      } = updateSettings;

      const result = await this.communityModel.updateOne(
        { chatId: updateSettings.chatId },
        {
          chatId: updateSettings.chatId,
          settings: { isTonConnectWallet },
        },
        { new: true },
      );

      return Boolean(result.modifiedCount);
    } catch (error) {
      throw new Error(error);
    }
  }
}
