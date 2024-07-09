import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PUBLIC_FS_DIRECTORY } from 'src/app.module';
import { CommunityService } from 'src/communities/community.service';
import { CommunityUserService } from 'src/communities/communityUser.service';
import { ReactionTrigger, ReferralTrigger, Triggers } from 'src/data/community.entity';
import { CommunityUser } from 'src/data/communityUser.entity';
import { START_BOT_DESCRIPTION } from 'src/globals';
import { ReferralsService } from 'src/referrals/referrals.service';
import { Input } from 'telegraf';
import Context, { NarrowedContext } from 'telegraf/typings/context';
import { Chat, Update } from 'telegraf/typings/core/types/typegram';

@Injectable()
export class MyChatMemberHandlerService {
  protected readonly logger = new Logger(MyChatMemberHandlerService.name);
  private readonly botName;
  private readonly webAppName;

  constructor(
    @InjectModel(CommunityUser.name) protected communityUserModel: Model<CommunityUser>,
    private readonly referralService: ReferralsService,
    private readonly configService: ConfigService,
    private readonly communityService: CommunityService,
    private readonly communityUserService: CommunityUserService,
  ) {
    this.botName = this.configService.getOrThrow('BOT_NAME');
    this.webAppName = this.configService.getOrThrow('WEB_APP_NAME');
  }

  async handle(update: NarrowedContext<Context<Update>, Update.MyChatMemberUpdate>) {
    this.logger.log(update.update);

    // TODO: check this when we change settings of the chat from private to public
    if (update.myChatMember.chat.type === 'private') {
      this.logger.log('Chat type was changed', update.myChatMember.chat.type);

      return;
    }
    const newBotStatus = update.myChatMember.new_chat_member.status;
    const oldBotStatus = update.myChatMember.old_chat_member.status;

    if (newBotStatus === 'administrator' && (oldBotStatus === 'left' || oldBotStatus === 'kicked')) {
      await this.handleBotAddedToChatAsAdmin(update);
    } else if (newBotStatus === 'administrator' && oldBotStatus !== 'left' && oldBotStatus !== 'kicked') {
      await this.handleBotPromotedToAdministrator(update.myChatMember.chat.id);
    } else if (newBotStatus !== 'administrator' && (oldBotStatus === 'left' || oldBotStatus === 'kicked')) {
      await this.handleBotAddedToChatAsNotAdmin(update);
    } else if (newBotStatus === 'left' || newBotStatus === 'kicked') {
      await this.handleBotDeletedFromCommunity(update.myChatMember.chat.id);
    }
  }

  private async handleBotPromotedToAdministrator(chatId: number) {
    this.logger.log(`Handle bot promoted to administator in ${chatId}`);
    await this.updateInviteLink(chatId);
  }

  private async handleBotDeletedFromCommunity(chatId: number) {
    this.logger.log(`Handle bot deleted from community ${chatId}`);
    await this.communityService.deleteCommunity(chatId);
    await this.communityUserService.deleteAllCommunityUserWithChatId(chatId);
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

  private async handleBotAddedToChatAsNotAdmin(update: NarrowedContext<Context<Update>, Update.MyChatMemberUpdate>) {
    this.logger.log(`Handle bot added to chat ${update.myChatMember.chat.id} as not admin`);
    const chatInfo = await update.getChat();
    // TODO: Get chat title from update message
    const title = (chatInfo as Chat.GroupGetChat).title;

    const triggers: Triggers = {
      reaction: new ReactionTrigger(0, 0, false),
      referral: new ReferralTrigger(0, 0, false),
    };

    const chatMemberCount = await this.getChatMembersCount(update);

    await this.communityService.createOrUpdateCommunity(
      update.myChatMember.chat.id,
      title,
      triggers,
      chatMemberCount,
      undefined,
    );

    await update.sendMessage(`https://t.me/${this.botName}/${this.webAppName}`);

    await this.sendCommunityLink(update);
  }
  private async handleBotAddedToChatAsAdmin(update: NarrowedContext<Context<Update>, Update.MyChatMemberUpdate>) {
    this.logger.log(`Handle bot added to chat ${update.myChatMember.chat.id} as admin`);
    const chatInfo = await update.getChat();
    // TODO: Get chat title from update message
    const title = (chatInfo as Chat.GroupGetChat).title;

    const triggers: Triggers = {
      reaction: new ReactionTrigger(0, 0, false),
      referral: new ReferralTrigger(0, 0, false),
    };

    const chatMemberCount = await this.getChatMembersCount(update);

    const inviteLink = await this.referralService.generateInviteLink(chatInfo.id);
    await this.communityService.createOrUpdateCommunity(
      update.myChatMember.chat.id,
      title,
      triggers,
      chatMemberCount,
      inviteLink,
    );

    await update.sendMessage(`https://t.me/${this.botName}/${this.webAppName}`);

    await this.sendCommunityLink(update);
  }

  async sendCommunityLink(update: NarrowedContext<Context<Update>, Update.MyChatMemberUpdate>) {
    try {
      this.logger.log('Sending photo from', PUBLIC_FS_DIRECTORY);

      await update.sendPhoto(Input.fromLocalFile(`${PUBLIC_FS_DIRECTORY}/BotStart.png`), {
        caption: START_BOT_DESCRIPTION,
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

  async updateInviteLink(chatId: number) {
    const inviteLink = await this.referralService.generateInviteLink(chatId);
    return await this.communityService.updateInviteLink(chatId, inviteLink);
  }
}
