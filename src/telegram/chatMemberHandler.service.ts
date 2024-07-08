import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommunityUserService } from 'src/communities/communityUser.service';
import { Community } from 'src/data/community.entity';
import { CommunityUser } from 'src/data/communityUser.entity';
import { CommunityUserHistory } from 'src/data/communityUserHistory.entity';
import { Referral } from 'src/data/referral.entity';
import { Context, NarrowedContext } from 'telegraf';
import { Chat, Update } from 'telegraf/typings/core/types/typegram';
import { AbstractChatMemberHandler } from './abstractChatMemberHandler.service';
import { CommunityService } from 'src/communities/community.service';

@Injectable()
export class ChatMemberHandlerService extends AbstractChatMemberHandler {
  constructor(
    @InjectModel(Referral.name) private referralModel: Model<Referral>,
    @InjectModel(CommunityUser.name) protected communityUserModel: Model<CommunityUser>,
    @InjectModel(Community.name) protected communityModel: Model<Community>,
    @InjectModel(CommunityUserHistory.name) protected communityUserHistoryModel: Model<CommunityUserHistory>,
    private readonly communityUserService: CommunityUserService,
    communityService: CommunityService,
  ) {
    super(communityModel, communityUserModel, communityService);
  }

  async handle(update: NarrowedContext<Context<Update>, Update.ChatMemberUpdate>) {
    this.logger.log(update.update);
    this.logger.log('update.chatMember.new_chat_member.status', update.chatMember.new_chat_member.status);
    // react when it is new user or user that previously created group joined
    const validStatuses = ['member', 'creator', 'left'];

    if (!validStatuses.includes(update.chatMember.new_chat_member.status)) {
      throw new Error('Invalid status');
    }

    if (update.chatMember.new_chat_member.status === 'left') {
      return await this.communityUserService.deleteCommunityUser(
        update.chatMember.chat.id,
        update.chatMember.new_chat_member.user.id,
      );
    }

    const inviteLink = update.chatMember.invite_link?.invite_link;
    const chatId = update.chatMember.chat.id;

    this.logger.log('inviteLink', inviteLink);

    const admins = await update.getChatAdministrators();
    const chatInfo = await update.getChat();
    const title = (chatInfo as Chat.GroupGetChat).title;

    if (!inviteLink) {
      // TODO: check this
      // try {
      //   // TODO: check this what should be here i dont know
      //   await this.createCommunityIfNotExist(chatId, title, undefined);
      // } catch (error) {
      //   this.logger.error(error);
      // }

      try {
        await this.createCommunityUserIfNoExist(chatId, update.chatMember.new_chat_member.user.id, title, admins);
      } catch (error) {
        this.logger.error(error);
      }

      return;
    }
  }
}
