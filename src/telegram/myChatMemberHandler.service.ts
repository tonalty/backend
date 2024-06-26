import Context, { NarrowedContext } from 'telegraf/typings/context';
import { Chat, Update } from 'telegraf/typings/core/types/typegram';
import { AbstractChatMemberHandler } from './abstractChatMemberHandler.service';
import { DeleteResult } from 'mongodb';
import { Injectable } from '@nestjs/common';
import { ReferralsService } from 'src/referrals/referrals.service';
import { InjectModel } from '@nestjs/mongoose';
import { Community } from 'src/data/community.entity';
import { CommunityUser } from 'src/data/communityUser.entity';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MyChatMemberHandlerService extends AbstractChatMemberHandler {
  private readonly botName;
  private readonly webAppName;

  constructor(
    @InjectModel(CommunityUser.name) protected communityUserModel: Model<CommunityUser>,
    @InjectModel(Community.name) protected communityModel: Model<Community>,
    private readonly referralService: ReferralsService,
    private readonly configService: ConfigService,
  ) {
    super(communityModel, communityUserModel);

    this.botName = this.configService.getOrThrow('BOT_NAME');
    this.webAppName = this.configService.getOrThrow('WEB_APP_NAME');
  }

  private async deleteCommunityUser(chatId: number): Promise<DeleteResult> {
    return await this.communityUserModel.deleteOne({ chatId });
  }

  private async deleteCommunity(chatId: number): Promise<DeleteResult> {
    return await this.communityModel.deleteOne({ chatId: chatId });
  }

  async handle(update: NarrowedContext<Context<Update>, Update.MyChatMemberUpdate>) {
    this.logger.log('update.myChatMember.new_chat_member', update.myChatMember.new_chat_member);

    if (update.myChatMember.new_chat_member.status === 'member') {
      const admins = await update.getChatAdministrators();
      const chatInfo = await update.getChat();
      const title = (chatInfo as Chat.GroupGetChat).title;

      await this.saveCommunity(update.myChatMember.chat.id, title);

      await this.saveUserCommunity(update.myChatMember.chat.id, update.myChatMember.from.id, title, admins);

      await update.sendMessage(`https://t.me/${this.botName}/${this.webAppName}`);
      // await update.sendMessage(`${this.referralService.createReferralLink({ chatId: update.myChatMember.chat.id })}`);
    }

    if (update.myChatMember.new_chat_member.status === 'left') {
      // in case bot is deleted we delete community also
      await this.deleteCommunity(update.myChatMember.chat.id);
      await this.deleteCommunityUser(update.myChatMember.chat.id);
    }
  }
}
