import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CommunityService } from 'src/communities/community.service';
import { CommunityUser } from 'src/data/communityUser.entity';
import { CommunityUserHistory, MessageReactionData } from 'src/data/communityUserHistory.entity';
import { Message } from 'src/data/message.entity';
import { Context, NarrowedContext } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import { inspect } from 'util';

@Injectable()
export class ReactionHandlerService {
  private readonly logger = new Logger(ReactionHandlerService.name);

  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(CommunityUser.name) private communityUserModel: Model<CommunityUser>,
    @InjectModel(CommunityUserHistory.name) private communityUserHistoryModel: Model<CommunityUserHistory>,
    private readonly communityService: CommunityService,
  ) {}

  async handle(ctx: NarrowedContext<Context<Update>, Update.MessageReactionUpdate>) {
    this.logger.log(ctx.update);
    const messageReaction = ctx.messageReaction;
    const message = await this.messageModel.findOneAndUpdate(
      {
        chatId: messageReaction.chat.id,
        messageId: messageReaction.message_id,
      },
      {
        $inc: {
          totalReactionsForMsg: messageReaction.new_reaction.length - messageReaction.old_reaction.length,
        },
      },
      {
        new: true,
      },
    );

    if (!message) {
      this.logger.log(
        `Message not found in DB: chatId = ${messageReaction.chat.id}, messageId = ${messageReaction.message_id}`,
      );
      return;
    }
    this.logger.log(`Message in DB: ${inspect(message)}`);
    this.communityService.increaseReactionCounter(message.chatId);
    await this.makeReward(message);
  }

  async makeReward(message: Message & { _id: Types.ObjectId }) {
    let triggers;
    const targetChatId = message.forwardedFromChatId ?? message.chatId;
    try {
      triggers = (await this.communityService.getCommunity(targetChatId)).triggers;
    } catch (err) {
      this.logger.error(err);
    }

    if (!triggers) {
      throw new Error('No triggers recieved');
    }

    if (message.points !== 0 || message.totalReactionsForMsg < triggers.reaction.threshold) {
      return;
    }

    try {
      const result = await this.messageModel.updateOne(
        {
          _id: message._id,
        },
        {
          $set: { points: triggers.reaction.points },
        },
      );
      if (result.modifiedCount === 1) {
        this.logger.log(`Added ${triggers.reaction.points} points for message ${message._id}`);
      }
    } catch (error) {
      this.logger.error('Error while saving user after threshold', error);
    }

    let communityUser;
    try {
      communityUser = await this.communityUserModel.findOneAndUpdate(
        { chatId: targetChatId, userId: message.creatorUserId },
        { $inc: { points: triggers.reaction.points } },
      );
    } catch (error) {
      this.logger.error('Error while updating community user table', error);
    }

    if (communityUser && triggers.reaction.isEnabled) {
      try {
        await this.communityUserHistoryModel.create({
          communityUserId: communityUser._id,
          data: new MessageReactionData(message._id, targetChatId, triggers.reaction.points),
        });
      } catch (error) {
        this.logger.error('Error while adding userHistory record', error);
      }
    }
  }
}
