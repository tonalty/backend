import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Community, Triggers } from 'src/data/community.entity';
import { TriggersDto } from './dto/triggersDto';
import { Logger } from '@nestjs/common';

export class TriggersService {
  private readonly logger = new Logger(TriggersService.name);

  constructor(@InjectModel(Community.name) private readonly communityModel: Model<Community>) {}

  async getTriggersByCommunity(chatId: number): Promise<Triggers> {
    try {
      const community = await this.communityModel.findOne({ chatId: chatId });

      if (!community) {
        throw new Error(`Could not find community with chatId ${chatId}`);
      }

      return community.triggers;
    } catch (error) {
      throw new Error(error);
    }
  }

  async updateTriggers(triggersDto: TriggersDto): Promise<boolean> {
    try {
      this.logger.log('updateTriggers triggersDto: ', JSON.stringify(triggersDto));
      const {
        triggers: { referral, reaction },
      } = triggersDto;

      this.logger.log('referral', referral);
      this.logger.log('reaction', reaction);

      const result = await this.communityModel.updateOne(
        { chatId: triggersDto.chatId },
        {
          chatId: triggersDto.chatId,
          triggers: { referral, reaction },
        },
        { new: true },
      );

      return Boolean(result.modifiedCount);
    } catch (error) {
      throw new Error(error);
    }
  }
}
