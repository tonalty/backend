import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommunityUserService } from 'src/communities/communityUser.service';
import { Community } from 'src/data/community.entity';
import { CommunityUser } from 'src/data/communityUser.entity';
import { CommunityUserHistory, ReferralJoinData } from 'src/data/communityUserHistory.entity';
import { Referral } from 'src/data/referral.entity';
import { Context, NarrowedContext } from 'telegraf';
import { Chat, Update } from 'telegraf/typings/core/types/typegram';
import { AbstractChatMemberHandler } from './abstractChatMemberHandler.service';
import { CommunityService } from 'src/communities/communities.service';

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
    let triggers;

    try {
      triggers = (await this.communityModel.findOne({ chatId: chatId }, { triggers: 1 }))?.triggers;
    } catch (error) {
      this.logger.log(error);
    }

    if (!triggers) {
      throw new Error('No triggers recieved');
    }

    this.logger.log('update.chatMember', JSON.stringify(update.chatMember));
    this.logger.log('referral', JSON.stringify(referral.ownerId));

    try {
      communityUser = await this.communityUserModel.bulkWrite([
        {
          updateOne: {
            filter: {
              userId: referral.ownerId,
              chatId: chatId,
            },
            update: {
              $inc: { points: triggers.referral.inviterPoints },
              communityName: title,
              isAdmin: admins.some((owner) => owner.user.id === referral.ownerId),
            },
            upsert: true,
          },
        },
        {
          updateOne: {
            filter: {
              userId: update.chatMember.from.id,
              chatId: chatId,
            },
            update: {
              $inc: { points: triggers.referral.inviteePoints },
              communityName: title,
              isAdmin: admins.some((owner) => owner.user.id === update.chatMember.from.id),
            },
            upsert: true,
          },
        },
      ]);
    } catch (error) {
      throw new Error(`Error while increasing points ${error}`);
    }

    this.logger.log('communityUser', communityUser);

    if (communityUser.insertedCount || communityUser.upsertedCount) {
      try {
        // TODO: CHECK CHAT HISTORY
        // right now only add points to owner of the link
        await this.communityUserHistoryModel.insertMany([
          {
            userId: referral.ownerId,
            communityId: chatId,
            data: new ReferralJoinData(
              referral.ownerId,
              referral.chatId,
              triggers.referral.inviterPoints,
              update.chatMember.from.username || update.chatMember.from.first_name || String(update.chatMember.from.id),
              true,
            ),
          },
          {
            userId: update.chatMember.from.id,
            communityId: chatId,
            data: new ReferralJoinData(
              update.chatMember.from.id,
              update.chatMember.chat.id,
              triggers.referral.inviteePoints,
              // right now we do not need this field but maybe later will need to change it
              update.chatMember.from.username || update.chatMember.from.first_name || String(update.chatMember.from.id),
              false,
            ),
          },
        ]);
      } catch (error) {
        throw new Error(`Error while adding user history record ${error}`);
      }
    }
    this.logger.log('Points were succesfully sent');
  }
}
