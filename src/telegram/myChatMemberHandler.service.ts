import Context, { NarrowedContext } from 'telegraf/typings/context';
import { Chat, Update, User } from 'telegraf/typings/core/types/typegram';
import { AbstractChatMemberHandler } from './abstractChatMemberHandler.service';
import { DeleteResult } from 'mongodb';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MyChatMemberHandlerService extends AbstractChatMemberHandler {
  private async deleteCommunityUser(chatId: number): Promise<DeleteResult> {
    return await this.communityUserModel.deleteOne({ chatId });
  }

  private async deleteCommunity(chatId: number): Promise<DeleteResult> {
    return await this.communityModel.deleteOne({ chatId: chatId });
  }

  async handle(update: NarrowedContext<Context<Update>, Update.MyChatMemberUpdate>) {
    if (update.myChatMember.new_chat_member.status === 'member') {
      const admins = await update.getChatAdministrators();
      const chatInfo = await update.getChat();
      const title = (chatInfo as Chat.GroupGetChat).title;

      await this.saveCommunity(update.myChatMember.chat.id, title);

      await this.saveUserCommunity(update.myChatMember.chat.id, update.myChatMember.from.id, title, admins);
    }

    if (update.myChatMember.new_chat_member.status === 'left') {
      // in case bot is deleted we delete community also
      await this.deleteCommunity(update.myChatMember.chat.id);
      await this.deleteCommunityUser(update.myChatMember.chat.id);
    }
  }
}
