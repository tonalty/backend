import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommunityUserService } from 'src/communities/communityUser.service';
import { CommunityUser } from 'src/data/communityUser.entity';
import { Context, NarrowedContext } from 'telegraf';
import { ChatMember, Update } from 'telegraf/typings/core/types/typegram';

@Injectable()
export class ChatMemberHandlerService {
  private readonly logger = new Logger(ChatMemberHandlerService.name);

  constructor(
    @InjectModel(CommunityUser.name) protected communityUserModel: Model<CommunityUser>,
    private readonly communityUserService: CommunityUserService,
  ) {}

  async handle(update: NarrowedContext<Context<Update>, Update.ChatMemberUpdate>) {
    this.logger.log(update.update);

    const newMemberStatus = update.chatMember.new_chat_member.status;
    const chatId = update.chatMember.chat.id;
    const userId = update.chatMember.new_chat_member.user.id;
    if (newMemberStatus === 'left' || newMemberStatus === 'kicked') {
      await this.handleMemberDeletedFromCommunity(chatId, userId);
    } else {
      await this.handleMemberStatusChange(chatId, userId, update.chatMember.new_chat_member);
    }
  }

  private async handleMemberDeletedFromCommunity(chatId: number, userId: number) {
    this.logger.log(`Handle memeber ${userId} deleted from community ${chatId}`);
    await this.communityUserService.deleteCommunityUser(chatId, userId);
  }

  private async handleMemberStatusChange(chatId: number, userId: number, newChatMember: ChatMember) {
    this.logger.log(`Handle chat ${chatId} member ${userId} status ${newChatMember.status} changed`);
    const isChatMemberAdmin = this.communityUserService.isChatMemberAdmin(newChatMember);
    await this.communityUserService.createOrUpdateCommunityUser(userId, chatId, isChatMemberAdmin);
  }
}
