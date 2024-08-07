import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { ChatMember } from 'telegraf/typings/core/types/typegram';
import { URL } from 'url';
import { ChatMemberHandlerService } from './chatMemberHandler.service';
import { MessageHandlerService } from './messageHandler.service';
import { MyChatMemberHandlerService } from './myChatMemberHandler.service';
import { ReactionHandlerService } from './reactionHandler.service';
import { ChannelPostHandlerService } from './channelPostHandler.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private readonly bot;
  private botId: number;

  constructor(configService: ConfigService) {
    const botToken = configService.getOrThrow('BOT_TOKEN');
    this.bot = new Telegraf(botToken);
  }

  async onModuleInit() {
    const response = await this.bot.telegram.getMe();
    this.botId = response.id;
  }

  getBotId() {
    return this.botId;
  }

  registerMessageReactionHandler(reactionHandlerService: ReactionHandlerService) {
    this.bot.on('message_reaction', async (ctx) => {
      try {
        await reactionHandlerService.handle(ctx);
      } catch (error) {
        this.logger.error('Error while reaction', error);
      }
    });
  }

  registerMessageHandler(messageHandlerService: MessageHandlerService) {
    this.bot.on('message', async (update) => {
      try {
        await messageHandlerService.handle(update);
      } catch (error) {
        this.logger.error('Error while adding channel to community', error);
      }
    });
  }

  registerChatMemberHandler(chatMemberHandlerService: ChatMemberHandlerService) {
    this.bot.on('chat_member', async (update) => {
      try {
        await chatMemberHandlerService.handle(update);
      } catch (error) {
        this.logger.error('Error while adding new chat member joinned the group. ', error);
      }
    });
  }

  registerMyChatMemberHandler(myChatMemberHandlerService: MyChatMemberHandlerService) {
    this.bot.on('my_chat_member', async (update) => {
      try {
        await myChatMemberHandlerService.handle(update);
      } catch (error) {
        this.logger.error('Error while adding new chat member joinned the group. ', error);
      }
    });
  }

  registerChannelPostHandler(channelPostHandlerService: ChannelPostHandlerService) {
    this.bot.on('channel_post', async (update) => {
      try {
        await channelPostHandlerService.handle(update);
      } catch (error) {
        this.logger.error('Error while adding new chat member joinned the group. ', error);
      }
    });
  }

  completeHandlerRegistration() {
    this.bot.catch((err) => this.logger.error(err));

    this.bot.launch({
      allowedUpdates: [
        'message',
        'message_reaction',
        'message_reaction_count',
        'message',
        'chat_member',
        'my_chat_member',
        'channel_post',
      ],
    });
  }

  destroyHandlerRegistration() {
    this.bot.stop();
  }

  getChatMember(userId: number, chatId: number): Promise<ChatMember> {
    return this.bot.telegram.getChatMember(chatId, userId);
  }

  async getBotInfo() {
    const getMe = await this.bot.telegram.getMe();

    if (getMe) {
      return {
        firstName: getMe?.first_name,
        lastName: getMe?.last_name,
        userName: getMe.username,
      };
    }

    throw new Error('Could not get bot information');
  }

  async getBotStatus(chatId: number) {
    const getMe = await this.bot.telegram.getMe();

    if (getMe) {
      const chatMember = await this.bot.telegram.getChatMember(chatId, getMe.id);

      this.logger.log('chatMember', JSON.stringify(chatMember));

      return { isAdmin: chatMember.status === 'administrator' };
    }

    throw new Error('Could not get bot information');
  }

  async getCommunityPhotoDownloadLink(chatId: number): Promise<URL | undefined> {
    const chat = await this.bot.telegram.getChat(chatId);
    if (!chat.photo) {
      return;
    }
    return this.bot.telegram.getFileLink(chat.photo.big_file_id);
  }
}
