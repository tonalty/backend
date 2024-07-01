import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommunityService } from 'src/communities/community.service';
import { CommunityUserService } from 'src/communities/communityUser.service';
import { Message } from 'src/data/message.entity';
import { Context, NarrowedContext, Telegram } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';

@Injectable()
export class MessageHandlerService {
  private readonly logger = new Logger(MessageHandlerService.name);

  constructor(
    @InjectModel(Message.name) private msgModel: Model<Message>,
    private readonly communityService: CommunityService,
    private readonly communityUserService: CommunityUserService,
  ) {}

  async handle(update: NarrowedContext<Context<Update>, Update.MessageUpdate>) {
    this.logger.log(update.update);
    if (update.update.message.hasOwnProperty('migrate_to_chat_id')) {
      const newChatId = (update.update.message as any).migrate_to_chat_id;
      const oldChatId = update.update.message.chat.id;
      this.logger.log(`We are going to update community id from ${oldChatId} to ${newChatId}`);
      if (newChatId !== undefined && oldChatId !== undefined) {
        this.communityService.updateCommunityId(oldChatId, newChatId);
        this.communityUserService.updateCommunityUserId(oldChatId, newChatId);
      }
    } else if (update.chat.type === 'private') {
      this.logger.log('Skipping processing because chat type is private');
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
    this.createCommunityUserIfNotExist(update.message.from.id, update.message.chat.id, update.telegram);
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
    this.communityUserService.createCommunityUser(userId, chatId, isAdmin);
  }
}
