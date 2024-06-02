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
      //       if (update.text === '/start') {
      //         await update.sendPhoto(
      //           // 'https://i0.wp.com/pictures.pibig.info/uploads/posts/2023-04/1680594642_pictures-pibig-info-p-utka-risunok-vkontakte-2.png?ssl=1',
      //           'https://cdn11.bigcommerce.com/s-g5m7dxaevg/images/stencil/1280x1280/products/307/1549/56__64108.1666686998.jpg?c=1',
      //         );

      //         await update.sendMessage(
      //           `Here is you reward: 20% discount.
      // Promo-code: HTSF-AKIR-QNCD`,
      //           // web_app: { url: 'https://tonalty.localhost.direct:5173/connectcommunity/-4270868384' },
      //           {
      //             reply_markup: {
      //               inline_keyboard: [
      //                 [
      //                   {
      //                     text: 'Open reward shop',
      //                     url: 'https://tonalty.localhost.direct:5173/connectcommunity/-4270868384',
      //                   },
      //                 ],
      //               ],
      //             },
      //           },
      //         );
      //       }

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
