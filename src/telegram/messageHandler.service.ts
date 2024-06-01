import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from 'src/data/message.entity';
import { Logger } from 'mongodb';
import { Context, NarrowedContext } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import { Community } from 'src/data/community.entity';

export class MessageHandlerService {
  private readonly logger = new Logger(MessageHandlerService.name);

  constructor(
    @InjectModel(Message.name) private msgModel: Model<Message>,
    @InjectModel(Community.name) private communityModel: Model<Community>,
  ) {}

  async handle(update: NarrowedContext<Context<Update>, Update.MessageUpdate>) {
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

    this.logger.info('Message in DB:', JSON.stringify(message));

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
