import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Message } from 'src/data/message.entity';
import { Logger } from 'mongodb';
import { MessageReactionUpdated } from 'telegraf/typings/core/types/typegram';
import { inspect } from 'util';
import { CommunityUser } from 'src/data/communityUser.entity';
export class ReactionHandlerService {
  private readonly logger = new Logger(ReactionHandlerService.name);
  private readonly thresholdForPoints: number;
  private readonly pointsReward: number;

  constructor(
    private configService: ConfigService,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(CommunityUser.name) private communityUserModel: Model<CommunityUser>,
  ) {
    this.thresholdForPoints = Number(this.configService.getOrThrow('THRESHOLD_FOR_POINTS'));
    this.pointsReward = Number(this.configService.getOrThrow('POINTS_REWARD'));
  }

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
      this.logger.info(
        `Message not found in DB: chatId = ${messageReaction.chat.id}, messageId = ${messageReaction.message_id}`,
      );
      return;
    }

    this.logger.info(`Message in DB: ${inspect(message)}`);

    await this.makeReward(message);
  }

  async makeReward(message: Document & Message) {
    if (message.points === 0 && message.totalReactionsForMsg >= this.thresholdForPoints) {
      try {
        await this.messageModel.updateOne(
          {
            _id: message._id,
          },
          {
            $set: { points: this.pointsReward },
          },
        );
      } catch (error) {
        this.logger.error('Error while saving user after threshold', error);
      }

      try {
        await this.communityUserModel.findOneAndUpdate(
          { chatId: message.chatId, userId: message.creatorUserId },
          { $inc: { points: this.pointsReward } },
        );
      } catch (error) {
        this.logger.error('Error while updating community user table', error);
      }

      // need to substruct remaining points for community here
    }
  }
}
