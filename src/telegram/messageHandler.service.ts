import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from 'src/data/message.entity';
import { Context, NarrowedContext } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import { Community } from 'src/data/community.entity';
import { Logger } from '@nestjs/common';

export class MessageHandlerService {
  private readonly logger = new Logger(MessageHandlerService.name);

  constructor(
    @InjectModel(Message.name) private msgModel: Model<Message>,
    @InjectModel(Community.name) private communityModel: Model<Community>,
  ) {}

  async handle(update: NarrowedContext<Context<Update>, Update.MessageUpdate>) {
    if (update.text === '/rewardShop') {
      await update.sendPhoto(
        'https://i0.wp.com/pictures.pibig.info/uploads/posts/2023-04/1680594642_pictures-pibig-info-p-utka-risunok-vkontakte-2.png?ssl=1',
        //'https://cdn11.bigcommerce.com/s-g5m7dxaevg/images/stencil/1280x1280/products/307/1549/56__64108.1666686998.jpg?c=1',
        {
          //caption: `Here is you reward: 20% discount.\nPromo-code: HTSF-AKIR-QNCD`,
          caption: `This channel uses the loyalty system.There are 215 unclaimed points left.
Start using our mini-app to be able to earn points and get rewards.`,
          //caption_entities: [{ offset: 0, length: 4, type: 'url',  }],
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Open reward shop',
                  url: `https://t.me/ttonalty_bot/tonalty?chatId=${update.chat.id}`,
                  //web_app: { url: 'https://tonalty.localhost.direct:5173' },
                },
              ],
            ],
          },
        },
      );
    }

    if (update.chat.type === 'private') {
      return;
    }

    const message = await this.msgModel.create({
      chatId: update.message.chat.id,
      messageId: update.message.message_id,
      creatorUserId: update.message.from.id,
      creatorUserName: update.message.from.username,
      creatorFirstName: update.message.from.first_name,
    });

    this.logger.log('Message in DB:', JSON.stringify(message));

    const admins = await update.getChatAdministrators();

    await this.communityModel.updateOne(
      { chatId: update.chat.id },
      {
        $setOnInsert: {
          chatId: update.chat.id,
          // logic when we calculate jetons here
          remainingPoints: 0,
          threshold: -1,
        },

        title: update.chat.title,
        adminUserIds: admins.map((x) => x.user.id),

        // deduplicate
        // $push: {
        // userIds: update.update.message.from.id,
        // },
      },
      { upsert: true }, // create a new document if no documents match the filter
    );
  }
}
