import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Community } from 'src/data/community.entity';
import { UpdateSettingsDto } from './dto/UpdateSettingsDto';

export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(@InjectModel(Community.name) private readonly communityModel: Model<Community>) {}

  async getSettingsByCommunity(chatId: number) {
    try {
      const community = await this.communityModel.findOne({ chatId: chatId });

      if (!community) {
        throw new Error(`Could not find community with chatId ${chatId}`);
      }

      return community.settings;
    } catch (error) {
      throw new Error(error);
    }
  }

  async updateSettings(updateSettings: UpdateSettingsDto): Promise<boolean> {
    try {
      this.logger.log('updateTriggers updateSettings: ', JSON.stringify(updateSettings));
      const {
        settings: { isTonConnectWallet },
      } = updateSettings;

      this.logger.log('isTonConnectWallet', isTonConnectWallet);

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
