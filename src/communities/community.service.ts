import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { join } from 'path';
import { PUBLIC_COMMUNITY_AVATAR_ENDPOINT, PUBLIC_FS_COMMUNITY_AVATAR_DIRECTORY } from 'src/app.module';
import { Community, Triggers } from 'src/data/community.entity';
import { CommunityUser } from 'src/data/communityUser.entity';
import { Message } from 'src/data/message.entity';
import { TelegramService } from 'src/telegram/telegram.service';
import { CommunityDto } from './dto/CommunityDto';
import { DownloaderService } from 'src/util/downloader/downloader.service';

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

  async createOrUpdateCommunity(chatId: number, title: string, triggers: Triggers, chatMemberCount: number) {
    try {
      // create
      const response = await this.communityModel.findOneAndUpdate(
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
        { upsert: true, projection: { _id: 1 }, new: true }, // create a new document if no documents match the filter
      );
      const imageFilename = `${response._id.toHexString()}.png`;
      const downloadPath = join(PUBLIC_FS_COMMUNITY_AVATAR_DIRECTORY, imageFilename);
      const avatarUrl = this.serverOrigin + join(PUBLIC_COMMUNITY_AVATAR_ENDPOINT, imageFilename);
      const telegramlink = await this.telegramService.getCommunityPhotoDownloadLink(chatId);
      if (telegramlink) {
        const isDownloadSuccess = await this.downloaderService.downloadFileTo(telegramlink, downloadPath);
        if (isDownloadSuccess) {
          await this.communityModel.updateOne({ chatId: chatId }, { $set: { photoLink: avatarUrl } });
        }
      } else {
        this.logger.log(`Unable to get download link for chat ${chatId} photo`);
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  async updateCommunityId(oldChatId: number, newChatId: number) {
    await this.communityModel.updateOne({ chatId: oldChatId }, { $set: { chatId: newChatId } });
  }
}
