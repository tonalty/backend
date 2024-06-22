import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Referral } from 'src/data/referral.entity';
import { CommunityUser } from 'src/data/communityUser.entity';
import { Context, NarrowedContext } from 'telegraf';
import { Chat, Update } from 'telegraf/typings/core/types/typegram';
import { Community } from 'src/data/community.entity';

export class ChatMemberHandlerService {
  private readonly logger = new Logger(ChatMemberHandlerService.name);

  constructor(
    @InjectModel(Referral.name) private referralModel: Model<Referral>,
    @InjectModel(CommunityUser.name) private communityUserModel: Model<CommunityUser>,
    @InjectModel(Community.name) private communityModel: Model<Community>
  ) {}

  async handle(update: NarrowedContext<Context<Update>, Update.ChatMemberUpdate>) {
    this.logger.log('invite link: ', JSON.stringify(update.chatMember.invite_link));
    this.logger.log('new chat member', JSON.stringify(update.chatMember.new_chat_member));

    // react when it is new user or user that previously created group joined
    const validStatuses = ['member', 'creator'];

    if (!validStatuses.includes(update.chatMember.new_chat_member.status)) {
      throw new Error('Invalid status');
    }
    const inviteLink = update.chatMember.invite_link?.invite_link;
    const chatId = update.chatMember.chat.id;
    this.logger.log('inviteLink', inviteLink);
    if (!inviteLink) {
      const admins = await update.getChatAdministrators();
      const chatInfo = await update.getChat();

      await this.communityModel.updateOne(
        { chatId: update.chat.id },
        {
          $setOnInsert: {
            chatId: update.chat.id,
            title: (chatInfo as Chat.GroupGetChat).title ?? `private-${chatInfo.id}`,
            // logic when we calculate jetons here
            remainingPoints: 0,
            threshold: -1,
          }
        },
        { upsert: true }, // create a new document if no documents match the filter
      );
      
      await this.communityUserModel.create({
        userId: update.from.id,
        communityId: update.chat.id,
        communityName: (chatInfo as Chat.GroupGetChat).title ?? `private-${chatInfo.id}`,
        points: 0,
        isAdmin: admins.some(owner => owner.user.id === update.from.id)
      });
      return;
    }

    const result = await this.referralModel.findOne({ inviteLink: inviteLink });

    if (!result) {
      throw new Error(`Could not find referral with by inviteLink ${inviteLink}`);
    }

    if (!update.chatMember.new_chat_member.user.id) {
      throw new Error('Joined user does not have id');
    }

    if (update.chatMember.new_chat_member.user.is_bot) {
      throw new Error('Joined user is bot');
    }

    if (result.ownerId === update.chatMember.new_chat_member.user.id) {
      throw new Error('Owner id of the link is the same as user id, so points would not be assigned');
    }

    let referralUpdate;
    try {
      referralUpdate = await this.referralModel.findOneAndUpdate(
        {
          _id: result._id,
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

    try {
      // right now only add points to owner of the link
      await this.communityUserModel.findOneAndUpdate(
        { userId: result.ownerId, communityId: chatId },
        { $inc: { points: 50 } },
        { upsert: true });
      // TODO: Add chat history update 
    } catch (error) {
      throw new Error(`Error while increasing points ${error}`);
    }

    this.logger.log('Points were succesfully sent');
  }
}
