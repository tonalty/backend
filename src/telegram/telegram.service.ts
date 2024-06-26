import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { ChatMember } from 'telegraf/typings/core/types/typegram';
import { ChatMemberHandlerService } from './chatMemberHandler.service';
import { MessageHandlerService } from './messageHandler.service';
import { MyChatMemberHandlerService } from './myChatMemberHandler.service';
import { ReactionHandlerService } from './reactionHandler.service';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly bot;

  constructor(configService: ConfigService) {
    const botToken = configService.getOrThrow('BOT_TOKEN');
    this.bot = new Telegraf(botToken);
  }

  registerMessageReactionHandler(reactionHandlerService: ReactionHandlerService) {
    this.bot.on('message_reaction', async (update) => {
      try {
        await reactionHandlerService.handle(update.messageReaction);
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
        this.logger.log('-------------chat_member-------------', JSON.stringify(update));
        await chatMemberHandlerService.handle(update);
      } catch (error) {
        this.logger.error('Error while adding new chat member joinned the group. ', error);
      }
    });
  }

  registerMyChatMemberHandler(myChatMemberHandlerService: MyChatMemberHandlerService) {
    this.bot.on('my_chat_member', async (update) => {
      try {
        this.logger.log('-------------my_chat_member-------------', JSON.stringify(update));
        await myChatMemberHandlerService.handle(update);
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
      ],
    });
  }

  destroyHandlerRegistration() {
    this.bot.stop();
  }

  getChatMember(userId: number, chatId: number): Promise<ChatMember> {
    return this.bot.telegram.getChatMember(chatId, userId);
  }

  getBotInfo() {
    const botInfo = this.bot.botInfo;

    if (botInfo) {
      return {
        firstName: botInfo?.first_name,
        lastName: botInfo?.last_name,
        userName: botInfo.username,
      };
    }

    throw new Error('Could not get bot information');
  }
}
