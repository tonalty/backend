import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PUBLIC_FS_DIRECTORY } from 'src/app.module';
import { CommunityService } from 'src/communities/community.service';
import { CommunityUserService } from 'src/communities/communityUser.service';
import { Message } from 'src/data/message.entity';
import { Context, Input, NarrowedContext, Telegram } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import { Commands, START_BOT_DESCRIPTION } from 'src/globals';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';

@Injectable()
export class MessageHandlerService {
  private readonly logger = new Logger(MessageHandlerService.name);
  private readonly botName: string;
  private readonly webAppName: string;

  constructor(
    @InjectModel(Message.name) private msgModel: Model<Message>,
    private readonly communityService: CommunityService,
    private readonly communityUserService: CommunityUserService,
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
  ) {
    this.botName = this.configService.getOrThrow('BOT_NAME');
    this.webAppName = this.configService.getOrThrow('WEB_APP_NAME');
  }

  async handle(ctx: NarrowedContext<Context<Update>, Update.MessageUpdate>) {
    this.logger.log(ctx.update);
    this.executeCommandFromMessage(ctx);

    if (ctx.update.message.hasOwnProperty('migrate_to_chat_id')) {
      const newChatId = (ctx.update.message as any).migrate_to_chat_id;
      const oldChatId = ctx.update.message.chat.id;
      this.logger.log(`We are going to update community id from ${oldChatId} to ${newChatId}`);
      if (newChatId !== undefined && oldChatId !== undefined) {
        this.communityService.updateCommunityId(oldChatId, newChatId);
        this.communityUserService.updateCommunityUserId(oldChatId, newChatId);
      }
      return;
    } else if (ctx.update.message.hasOwnProperty('group_chat_created')) {
      // When user first time creates a chat with bot, the bot will recieve message with group_chat_created: true, property.
      // But in this case we will try to add user also by my_chat_member event. Because of it we may face race condition
      // This condition used to prevent this case of race condition
      this.logger.log('Received group chat created message');
      return;
    } else if (ctx.update.message.hasOwnProperty('migrate_from_chat_id')) {
      // It could be also the case for race condition
      this.logger.log('Recieved migrate_from_chat_id message');
      return;
    } else if (ctx.update.message.hasOwnProperty('new_chat_participant')) {
      // Presumably this kind of message is causing race condition and two records using findOneAndUpdate and updateOne with upsert are created
      this.logger.log('Recieved new_chat_participant message');
      return;
    } else if (ctx.update.message.hasOwnProperty('left_chat_participant')) {
      // This message sent when bot or some other chat member removed. As we registered to chat_member and my_chat_member it is now not needed
      this.logger.log('Recieved left_chat_participant message');
      return;
    } else if (ctx.chat.type === 'private') {
      this.logger.log('Skipping processing because chat type is private');
      return;
    }

    let forwardedFromChatId;
    if (ctx.update.message.hasOwnProperty('reply_to_message')) {
      // Handle channel post reply
      const anyMessage = ctx.update.message as any;
      forwardedFromChatId = anyMessage?.reply_to_message?.forward_from_chat?.id;
    } else if (ctx.update.message.hasOwnProperty('forward_from_chat')) {
      // Handle channel post
      const anyMessage = ctx.update.message as any;
      forwardedFromChatId = anyMessage?.forward_from_chat?.id;
      this.logger.log(`Recieved channel ${forwardedFromChatId} post message. Discard it for now`);
      return;
    }
    this.logger.log(`The sender chat is ${ctx.update.message.chat.id} forwarded ${forwardedFromChatId}`);

    const message = await this.msgModel.create({
      chatId: ctx.message.chat.id,
      forwardedFromChatId: forwardedFromChatId,
      messageId: ctx.message.message_id,
      creatorUserId: ctx.message.from.id,
    });
    this.communityService.increaseMessageCounter(forwardedFromChatId ?? ctx.message.chat.id);
    this.createCommunityUserIfNotExist(ctx.message.from.id, forwardedFromChatId ?? ctx.message.chat.id, ctx.telegram);
    this.logger.log('Message in DB:', JSON.stringify(message));
  }

  private async createCommunityUserIfNotExist(userId: number, chatId: number, telegram: Telegram) {
    const communityUser = await this.communityUserService.getCommunityUser(userId, chatId);
    if (communityUser) {
      this.logger.log(`Community user with id ${userId} exist in chat id ${chatId}`);
      return;
    }
    let chatMember;
    try {
      chatMember = await telegram.getChatMember(chatId, userId);
    } catch (error) {
      this.logger.log(`Failed to add community user userId ${userId}, chatId ${chatId}`, error);
      return;
    }
    const isAdmin = this.communityUserService.isChatMemberAdmin(chatMember);
    try {
      await this.communityUserService.createOrUpdateCommunityUser(userId, chatId, isAdmin);
    } catch (error) {
      this.logger.log(error);
    }
  }

  private async executeCommandFromMessage(ctx: NarrowedContext<Context<Update>, Update.MessageUpdate>) {
    if (ctx.text === Commands.START) {
      this.logger.log('Sending photo from', PUBLIC_FS_DIRECTORY);

      await ctx.sendPhoto(Input.fromLocalFile(`${PUBLIC_FS_DIRECTORY}/BotStart.png`), {
        caption: START_BOT_DESCRIPTION,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Open communities',
                url: `https://t.me/${this.botName}/${this.webAppName}`,
              },
            ],
          ],
        },
      });
    }
  }
}
