import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Referral } from 'src/data/referral.entity';
import { CommunityUser } from 'src/data/communityUser.entity';
import { Context, NarrowedContext } from 'telegraf';
import { Chat, Update } from 'telegraf/typings/core/types/typegram';
import { Community } from 'src/data/community.entity';
import { AbstractChatMemberHandler } from './abstractChatMemberHandler.service';
import { DeleteResult } from 'mongodb';
import { CommunityUserHistory, ReferralJoinData } from 'src/data/communityUserHistory.entity';

@Injectable()
export class ChatMemberHandlerService extends AbstractChatMemberHandler {
  constructor(
    @InjectModel(Referral.name) private referralModel: Model<Referral>,
    @InjectModel(CommunityUser.name) protected communityUserModel: Model<CommunityUser>,
    @InjectModel(Community.name) protected communityModel: Model<Community>,
    @InjectModel(CommunityUserHistory.name) protected communityUserHistoryModel: Model<CommunityUserHistory>,
  ) {
    super(communityModel, communityUserModel);
  }

  private async deleteCommunityUser(chatId: number, userId: number): Promise<DeleteResult> {
    return await this.communityUserModel.deleteOne({ chatId, userId });
  }

  async handle(update: NarrowedContext<Context<Update>, Update.ChatMemberUpdate>) {
    this.logger.log('update.chatMember.new_chat_member.status', update.chatMember.new_chat_member.status);
    // react when it is new user or user that previously created group joined
    const validStatuses = ['member', 'creator', 'left'];

    if (!validStatuses.includes(update.chatMember.new_chat_member.status)) {
      throw new Error('Invalid status');
    }

    if (update.chatMember.new_chat_member.status === 'left') {
      return await this.deleteCommunityUser(update.chatMember.chat.id, update.chatMember.new_chat_member.user.id);
    }

    const inviteLink = update.chatMember.invite_link?.invite_link;
    const chatId = update.chatMember.chat.id;

    this.logger.log('inviteLink', inviteLink);

    if (!inviteLink) {
      const admins = await update.getChatAdministrators();
      const chatInfo = await update.getChat();
      const title = (chatInfo as Chat.GroupGetChat).title;

      try {
        await this.saveCommunity(chatId, title);
      } catch (error) {
        this.logger.error(error);
      }

      try {
        await this.saveUserCommunity(chatId, update.chatMember.new_chat_member.user.id, title, admins);
      } catch (error) {
        this.logger.error(error);
      }

      return;
    }

    const referral = await this.referralModel.findOne({ inviteLink: inviteLink });

    if (!referral) {
      throw new Error(`Could not find referral with by inviteLink ${inviteLink}`);
    }

    if (!update.chatMember.new_chat_member.user.id) {
      throw new Error('Joined user does not have id');
    }

    if (update.chatMember.new_chat_member.user.is_bot) {
      throw new Error('Joined user is bot');
    }

    if (referral.ownerId === update.chatMember.new_chat_member.user.id) {
      throw new Error('Owner id of the link is the same as user id, so points would not be assigned');
    }

    let referralUpdate;
    try {
      referralUpdate = await this.referralModel.findOneAndUpdate(
        {
          _id: referral._id,
          // only update visitorIds if we do not have this user previously else return null
          visitorIds: {
            $ne: update.chatMember.new_chat_member.user.id,
          },
        },
        { $addToSet: { visitorIds: update.chatMember.new_chat_member.user.id } },
      );
    } catch (error) {
      throw new Error(`Error while adding user to visitors ${error}`);
    }

    if (!referralUpdate) {
      throw new Error(`This user with id ${update.chatMember.new_chat_member.user.id} had already recieved points`);
    }

    let communityUser;
    try {
      // right now only add points to owner of the link
      communityUser = await this.communityUserModel.findOneAndUpdate(
        { userId: update.chatMember.new_chat_member.user.id, chatId: chatId },
        { $inc: { points: 50 } },
        { upsert: true, new: true },
      );
    } catch (error) {
      throw new Error(`Error while increasing points ${error}`);
    }

    if (communityUser) {
      try {
        // right now only add points to owner of the link
        await this.communityUserHistoryModel.create({
          userId: communityUser.userId,
          communityId: communityUser.chatId,
          data: new ReferralJoinData(
            update.chatMember.new_chat_member.user.id,
            update.chatMember.chat.id,
            50,
            referral.ownerName,
          ),
        });
      } catch (error) {
        throw new Error(`Error while adding user history record ${error}`);
      }
    }
    this.logger.log('Points were succesfully sent');
  }
}
