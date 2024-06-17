import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  constructor(
    private readonly tmaService: TmaService,

    @InjectModel(Referral.name) private readonly referralModel: Model<Referral>,
  ) {}

  async generateReferral(userId: number, chatId: number): Promise<string> {
    const payload = Buffer.from(JSON.stringify({ ownerId: userId })).toString('base64');

    console.log('payload', payload);

    const link = `https://t.me/tonalty_local_bot/testapp?startapp=${encodeURIComponent(payload)}`;

    try {
      await this.referralModel.findOneAndUpdate(
        {
          chatId: chatId,
          ownerId: userId,
        },
        {
          $setOnInsert: {
            chatId: chatId,
            ownerId: userId,
            link,
            isActivated: false,
          },
        },
        { upsert: true },
      );
    } catch (error) {
      throw new Error(`Failed to update referral ${error}`);
    }

    return Promise.resolve(link);
  }

  async tgWebAppStartParam(payload: TgWebAppStartParam) {
    const webAppInitData = this.tmaService.parseWebAppInitData(payload['#tgWebAppData']);

    const startParam = new URLSearchParams(payload['#tgWebAppData']).get('start_param');

    if (!startParam) {
      throw new Error('start_param should exist');
    }

    const ownerId = JSON.parse(Buffer.from(startParam, 'base64').toString()).ownerId;

    await this.referralModel.findOneAndUpdate(
      { ownerId },
      {
        isActivated: true,
        visitorId: webAppInitData.user?.id,
      },
    );
  }
}
