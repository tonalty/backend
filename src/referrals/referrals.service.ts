import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Community } from 'src/data/community.entity';
import { Referral } from 'src/data/referral.entity';
import { TmaService } from 'src/tma/tma.service';

export interface TgWebAppStartParam {
  ['#tgWebAppData']: string;
  tgWebAppPlatform: string;
  tgWebAppThemeParams: string;
  tgWebAppVersion: string;
}

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);
  private readonly botToken: string;

  constructor(
    private readonly tmaService: TmaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,

    @InjectModel(Referral.name) private readonly referralModel: Model<Referral>,
    @InjectModel(Community.name) private readonly communityModel: Model<Community>,
  ) {
    this.botToken = this.configService.getOrThrow('BOT_TOKEN');
  }

  async generateReferral(userId: number, chatId: number, title: string, name: string): Promise<string> {
    let inviteLinkResponse;

    try {
      inviteLinkResponse = await this.httpService.axiosRef.post(
        `https://api.telegram.org/bot${this.botToken}/exportChatInviteLink`,
        {
          chat_id: chatId,
        },
      );
    } catch (error) {
      this.logger.error('Error while retrieving telegram invite link', error);
    }

    if (!inviteLinkResponse) {
      throw new Error('Could not recieve telegram invite link');
    }

    const {
      data: { result: telegramInviteLink },
    } = inviteLinkResponse;

    const _id = new mongoose.Types.ObjectId();

    const payload = Buffer.from(JSON.stringify({ _id, ownerId: userId, title, name, telegramInviteLink }))
      .toString('base64')
      .replace(/=+$/, '');

    const link = `https://t.me/tonalty_local_bot/testapp?startapp=${encodeURIComponent(payload)}`;

    try {
      await this.referralModel.findOneAndUpdate(
        {
          chatId: chatId,
          ownerId: userId,
        },
        {
          $setOnInsert: {
            _id,
            chatId: chatId,
            ownerId: userId,
            link,
            isActivated: false,
            inviteLink: telegramInviteLink,
          },
        },
        { upsert: true },
      );
    } catch (error) {
      throw new Error(`Failed to update referral ${error}`);
    }

    return Promise.resolve(link);
  }

  decodeStartParam(startParam: string) {
    this.logger.log('decodeStartParam', startParam);

    const payload = decodeURIComponent(startParam);

    return Buffer.from(payload, 'base64').toString();
  }

  // async tgWebAppStartParam(payload: TgWebAppStartParam) {
  //   const webAppInitData = this.tmaService.parseWebAppInitData(payload['#tgWebAppData']);

  //   const startParam = new URLSearchParams(payload['#tgWebAppData']).get('start_param');

  //   if (!startParam) {
  //     throw new Error('start_param should exist');
  //   }

  //   const ownerId = JSON.parse(Buffer.from(startParam, 'base64').toString()).ownerId;

  //   await this.referralModel.findOneAndUpdate(
  //     { ownerId },
  //     {
  //       isActivated: true,
  //       visitorId: webAppInitData.user?.id,
  //     },
  //   );
  // }
}
