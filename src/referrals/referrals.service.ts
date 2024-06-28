import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Referral } from 'src/data/referral.entity';

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
  private readonly botName;
  private readonly webAppName;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,

    @InjectModel(Referral.name) private readonly referralModel: Model<Referral>,
  ) {
    this.botToken = this.configService.getOrThrow('BOT_TOKEN');
    this.botName = this.configService.getOrThrow('BOT_NAME');
    this.webAppName = this.configService.getOrThrow('WEB_APP_NAME');
  }

  async generateReferral(userId: number, chatId: number, title: string, name: string): Promise<string> {
    this.logger.log('this.botToken', this.botToken);
    this.logger.log('this.botName', this.botName);
    this.logger.log('this.webAppName', this.webAppName);
    const referral = await this.referralModel.findOne({
      chatId: chatId,
      ownerId: userId,
    });

    if (referral === null) {
      let inviteLinkResponse;

      const _id = new mongoose.Types.ObjectId().toString();

      this.logger.log('_id generated', _id);

      try {
        // create only once
        inviteLinkResponse = await this.httpService.axiosRef.post(
          `https://api.telegram.org/bot${this.botToken}/createChatInviteLink`,
          {
            chat_id: chatId,
            creates_join_request: false,
            name: `${_id}`,
          },
        );
      } catch (error) {
        this.logger.error('Error while retrieving telegram invite link check that bot has admin rights!!!', error);
      }

      if (!inviteLinkResponse) {
        throw new Error('Could not recieve telegram invite link');
      }

      const {
        data: {
          result: { invite_link: telegramInviteLink },
        },
      } = inviteLinkResponse;

      const params = { ownerId: userId, title, name, telegramInviteLink, chatId };
      const link = this.createReferralLink(params);

      try {
        await this.referralModel.create({
          _id,
          chatId: chatId,
          ownerId: userId,
          ownerName: name,
          link,
          inviteLink: telegramInviteLink,
        });

        return Promise.resolve(link);
      } catch (error) {
        throw new Error(`Failed to update referral ${error}`);
      }
    }

    return Promise.resolve(referral.link);
  }

  createReferralLink(params: unknown) {
    const payload = Buffer.from(JSON.stringify(params)).toString('base64').replace(/=+$/, '');

    return `https://t.me/${this.botName}/${this.webAppName}?startapp=${encodeURIComponent(payload)}`;
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
