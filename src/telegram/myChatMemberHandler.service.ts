import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult } from 'mongodb';
import { Model } from 'mongoose';
import { CommunityService } from 'src/communities/community.service';
import { Community, ReactionTrigger, ReferralTrigger, Triggers } from 'src/data/community.entity';
import { CommunityUser } from 'src/data/communityUser.entity';
import { ReferralsService } from 'src/referrals/referrals.service';
import Context, { NarrowedContext } from 'telegraf/typings/context';
import { Chat, Update } from 'telegraf/typings/core/types/typegram';
import { AbstractChatMemberHandler } from './abstractChatMemberHandler.service';
import { PUBLIC_FS_DIRECTORY } from 'src/app.module';
import { Input } from 'telegraf';

@Injectable()
export class MyChatMemberHandlerService extends AbstractChatMemberHandler {
  private readonly botName;
  private readonly webAppName;

  constructor(
    @InjectModel(CommunityUser.name) protected communityUserModel: Model<CommunityUser>,
    @InjectModel(Community.name) protected communityModel: Model<Community>,
    private readonly referralService: ReferralsService,
    private readonly configService: ConfigService,
    communityService: CommunityService,
  ) {
    super(communityModel, communityUserModel, communityService);

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
    this.logger.log('update.myChatMember.new_chat_member.status', update.myChatMember.new_chat_member.status);
    this.logger.log(update.update);

    // TODO: check this when we change settings of the chat from private to public
    if (update.myChatMember.chat.type === 'private') {
      this.logger.log('Chat type was changed', update.myChatMember.chat.type);

      return;
    }

    if (update.myChatMember.old_chat_member.status === 'left') {
      const isBotAdmin = update.myChatMember.new_chat_member.status === 'administrator';
      this.handleBotAddedToChat(update, isBotAdmin);
    } else if (update.myChatMember.new_chat_member.status === 'left') {
      // in case bot is deleted we delete community also
      await this.deleteCommunity(update.myChatMember.chat.id);
      await this.deleteCommunityUser(update.myChatMember.chat.id);
    }
  }

  private async getChatMembersCount(
    update: NarrowedContext<Context<Update>, Update.MyChatMemberUpdate>,
  ): Promise<number> {
    try {
      return await update.getChatMembersCount();
    } catch (error) {
      this.logger.log('Failed to get members count', error);
    }
    return 1;
  }

  private async handleBotAddedToChat(
    update: NarrowedContext<Context<Update>, Update.MyChatMemberUpdate>,
    isBotAdmin: boolean,
  ) {
    const chatInfo = await update.getChat();
    // TODO: Get chat title from update message
    const title = (chatInfo as Chat.GroupGetChat).title;

    const triggers: Triggers = {
      reaction: new ReactionTrigger(0, 0, false),
      referral: new ReferralTrigger(0, 0, false),
    };

    const chatMemberCount = await this.getChatMembersCount(update);

    await this.communityService.createOrUpdateCommunity(update.myChatMember.chat.id, title, triggers, chatMemberCount);

    await this.createCommunityUserIfNotExist1(
      update.myChatMember.chat.id,
      update.myChatMember.from.id,
      title,
      isBotAdmin,
    );

    await update.sendMessage(`https://t.me/${this.botName}/${this.webAppName}`);

    try {
      this.logger.log('Sending photo from', PUBLIC_FS_DIRECTORY);

      await update.sendPhoto(Input.fromLocalFile(`${PUBLIC_FS_DIRECTORY}/BotStart.png`), {
        caption: `Tonality is a point reward system that adds value to customer brand interactions.\n\n• Encourage targeted actions\n\n• No technical expertise required, manage via Telegram bot\n\n• Explore new ways to engage`,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Open your community profile',
                url: `${this.referralService.createReferralLink({ chatId: update.myChatMember.chat.id })}`,
              },
            ],
          ],
        },
      });
    } catch (error) {
      this.logger.log('Failed to send photo', error);

      this.logger.error(error);
    }
  }
}
