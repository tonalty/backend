import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommunityService } from 'src/communities/community.service';
import { Message } from 'src/data/message.entity';
import { Context, NarrowedContext } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';

@Injectable()
export class MessageHandlerService {
  private readonly logger = new Logger(MessageHandlerService.name);

  constructor(
    @InjectModel(Message.name) private msgModel: Model<Message>,
    private readonly communityService: CommunityService,
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
    this.communityService.increaseMessageCounter(update.message.chat.id);
    this.logger.log('Message in DB:', JSON.stringify(message));
  }
}
