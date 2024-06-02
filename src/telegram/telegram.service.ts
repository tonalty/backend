import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Message } from '../data/message.entity';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageHandlerService } from './messageHandler.service';
import { ReactionHandlerService } from './reactionHandler.service';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;

  constructor(
    configService: ConfigService,
    private readonly messageHandlerService: MessageHandlerService,
    private readonly reactionHandlerService: ReactionHandlerService,
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
  ) {
    this.botToken = configService.getOrThrow('BOT_TOKEN');
  }

  private bot: Telegraf;

  async onModuleInit() {
    this.bot = new Telegraf(this.botToken);

    this.bot.on('message_reaction', async (update) => {
      try {
        await this.reactionHandlerService.handle(update.messageReaction);
      } catch (error) {
        this.logger.error('Error while reaction', error);
      }
    });

    this.bot.on('message', async (update) => {
      try {
        await this.messageHandlerService.handle(update);
      } catch (error) {
        this.logger.error('Error while adding channel to community', error);
      }
    });

    this.bot.catch((err) => this.logger.error(err));

    this.bot.launch({
      allowedUpdates: ['message', 'message_reaction', 'message_reaction_count', 'message'],
    });
  }

  async onModuleDestroy() {
    this.bot.stop();
  }

  getAllMessages(): Promise<Array<Message>> {
    return this.messageModel.find({});
  }
}
