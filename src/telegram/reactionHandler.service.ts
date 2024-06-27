import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from 'src/data/message.entity';
import { MessageReactionUpdated } from 'telegraf/typings/core/types/typegram';
import { inspect } from 'util';
import { CommunityUser } from 'src/data/communityUser.entity';
import { MessageReactionData, CommunityUserHistory } from 'src/data/communityUserHistory.entity';
import { Injectable, Logger } from '@nestjs/common';
import { Community } from 'src/data/community.entity';

@Injectable()
export class ReactionHandlerService {
  private readonly logger = new Logger(ReactionHandlerService.name);

  constructor(
    private configService: ConfigService,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Community.name) private communityModel: Model<Community>,
    @InjectModel(CommunityUser.name) private communityUserModel: Model<CommunityUser>,
    @InjectModel(CommunityUserHistory.name) private communityUserHistoryModel: Model<CommunityUserHistory>,
  ) {}

  async handle(messageReaction: MessageReactionUpdated) {
    const message = await this.messageModel.findOneAndUpdate(
      {
        chatId: messageReaction.chat.id,
        messageId: messageReaction.message_id,
      },
      {
        $inc: {
          totalReactionsForMsg: messageReaction.new_reaction.length - messageReaction.old_reaction.length,
        },
        // ToDo: either remove or replace with 2 DB calls
        // It stores all reactions that user set for the message
        /*
        $push: {
          reactions: messageReaction.new_reaction.map((reactionType) => ({
            ...reactionType,
            userId: messageReaction.user?.id,
          })),
        },
        $pull: {
          reactions: messageReaction.old_reaction.map((reactionType) => ({
            ...reactionType,
            userId: messageReaction.user?.id,
          })),
        },
        */
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

    await this.makeReward(message);
  }

  async makeReward(message: Message & { _id: Types.ObjectId }) {
    let triggers;

    try {
      triggers = (await this.communityModel.findOne({ chatId: message.chatId }, { triggers: 1 }))?.triggers;
    } catch (err) {
      this.logger.error(err);
    }

    this.logger.log('makeReward triggers', triggers);

    if (!triggers) {
      throw new Error('No triggers recieved');
    }

    if (message.points !== 0 || message.totalReactionsForMsg < triggers.reaction.threshold) {
      return;
    }

    try {
      await this.messageModel.updateOne(
        {
          _id: message._id,
        },
        {
          $set: { points: triggers.reaction.points },
        },
      );
    } catch (error) {
      this.logger.error('Error while saving user after threshold', error);
    }

    let communityUser;
    try {
      communityUser = await this.communityUserModel.findOneAndUpdate(
        { chatId: message.chatId, userId: message.creatorUserId },
        { $inc: { points: triggers.reaction.points } },
      );
    } catch (error) {
      this.logger.error('Error while updating community user table', error);
    }

    if (communityUser) {
      try {
        await this.communityUserHistoryModel.create({
          userId: communityUser.userId,
          communityId: communityUser.chatId,
          data: new MessageReactionData(message._id, message.chatId, triggers.reaction.points),
        });
      } catch (error) {
        this.logger.error('Error while adding userHistory record', error);
      }
    }
    // need to substruct remaining points for community here
  }
}
