import { BadRequestException, Injectable, Logger, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CommunityUserService } from 'src/communities/communityUser.service';
import { Reward } from 'src/data/reward.entity';
import { HistoryService } from 'src/history/history.service';
import { TempImageService } from 'src/temp/image/image.service';
import { AdminRewardDto } from './dto/AdminRewardDto';
import { BuyRewardResponseDto } from './dto/BuyRewardResponseDto';
import { CreateRewardDto } from './dto/CreateRewardDto';
import { RewardPreview } from './dto/RewardPreviewDto';
import { UpdateRewardDto } from './dto/UpdateRewardDto';
import { UserRewardDto } from './dto/UserRewardDto';

@Injectable()
export class RewardService {
  private readonly logger = new Logger(RewardService.name);

  constructor(
    @InjectModel(Reward.name) private readonly rewardModel: Model<Reward>,
    private readonly tempImageService: TempImageService,
    private readonly communityUserService: CommunityUserService,
    private readonly historyService: HistoryService,
  ) {}

  async createReward(userId: number, rewardDto: CreateRewardDto): Promise<AdminRewardDto> {
    if (rewardDto.canBeUsedTimes === 0) {
      throw new NotAcceptableException('canBeUsedTimes cannot be equal to zero');
    }
    await this.communityUserService.validateUserIsAdmin(userId, rewardDto.chatId);
    const rewardId = new Types.ObjectId();
    const imagePublicPath = await this.tempImageService.saveImageToPermanent(rewardDto.imageId, rewardId.toHexString());
    const reward = await this.rewardModel.create({
      _id: rewardId,
      imageUrl: imagePublicPath,
      ...rewardDto,
    });
    return new AdminRewardDto(reward);
  }

  async updateReward(userId: number, updateRewardDto: UpdateRewardDto): Promise<boolean> {
    await this.communityUserService.validateUserIsAdmin(userId, updateRewardDto.chatId);
    let imagePublicPath = updateRewardDto.imageUrl;
    let isImageUpdated = false;
    if (updateRewardDto.imageId) {
      const reward = await this.rewardModel.findOne({ _id: new Types.ObjectId(updateRewardDto.id) }, { _id: 1 });
      if (reward) {
        imagePublicPath = await this.tempImageService.saveImageToPermanent(updateRewardDto.imageId, updateRewardDto.id);
        isImageUpdated = true;
      } else {
        throw new NotFoundException(`Unable to find reward to update by id ${updateRewardDto.id}`);
      }
    }
    const result = await this.rewardModel.updateOne(
      { _id: new Types.ObjectId(updateRewardDto.id) },
      { imageUrl: imagePublicPath, ...updateRewardDto },
    );
    if (result.modifiedCount === 1 || isImageUpdated) {
      return true;
    } else {
      this.logger.log('Unable to update record', result);
      return false;
    }
  }

  async getAdminReward(userId: number, rewardId: string, chatId: number): Promise<AdminRewardDto | null> {
    await this.communityUserService.validateUserIsAdmin(userId, chatId);
    const reward = await this.rewardModel.findOne({ _id: new Types.ObjectId(rewardId), chatId: chatId });
    if (reward) {
      return new AdminRewardDto(reward);
    } else {
      return reward;
    }
  }

  async getUserReward(userId: number, rewardId: string, chatId: number): Promise<UserRewardDto | null> {
    await this.communityUserService.validateCommunityUserPresent(userId, chatId);
    const reward = await this.rewardModel.findOne({ _id: new Types.ObjectId(rewardId), chatId: chatId });
    if (reward) {
      return new UserRewardDto(reward);
    } else {
      return reward;
    }
  }

  async getRewards(userId: number, chatId: number, limit: number, offset: number): Promise<Array<RewardPreview>> {
    const communityUser = await this.communityUserService.getCommunityUser(userId, chatId);
    if (!communityUser) {
      this.logger.log(`Unable to find community ${chatId} user ${userId} for reward`);
      return [];
    }
    const rewards = await this.rewardModel.find(
      { chatId: chatId, canBeUsedTimes: { $ne: 0 } },
      { _id: 1, chatId: 1, imageUrl: 1, title: 1, value: 1 },
      { m: limit, skip: offset },
    );
    if (rewards) {
      return rewards.map((reward) => new RewardPreview(reward));
    } else {
      throw new BadRequestException('Error during reward request');
    }
  }

  async deleteReward(userId: number, rewardId: string, chatId: number): Promise<boolean> {
    await this.communityUserService.validateUserIsAdmin(userId, chatId);
    const result = await this.rewardModel.deleteOne({ _id: new Types.ObjectId(rewardId), chatId: chatId });
    if (result.deletedCount === 1) {
      return true;
    } else {
      return false;
    }
  }

  async buyReward(rewardId: string, chatId: number, userId: number): Promise<BuyRewardResponseDto> {
    const reward = await this.rewardModel.findOneAndUpdate(
      { _id: new Types.ObjectId(rewardId), chatId: chatId, canBeUsedTimes: { $ne: 0 } },
      [
        {
          $set: {
            canBeUsedTimes: {
              $cond: {
                if: {
                  $gt: ['$canBeUsedTimes', 0],
                },
                then: {
                  $subtract: ['$canBeUsedTimes', 1],
                },
                else: '$canBeUsedTimes',
              },
            },
          },
        },
      ],
      { new: true },
    );
    if (!reward) {
      throw new NotFoundException(`Unable to find reward by id ${rewardId} in chat ${chatId}`);
    }
    const result = await this.communityUserService.decreaseCommunityUserPoints(userId, chatId, reward.value);
    if (!result) {
      await this.rewardModel.updateOne({ _id: new Types.ObjectId(rewardId), chatId: chatId }, [
        {
          $set: {
            canBeUsedTimes: {
              $cond: {
                if: {
                  $gte: ['$canBeUsedTimes', 0],
                },
                then: {
                  $add: ['$canBeUsedTimes', 1],
                },
                else: '$canBeUsedTimes',
              },
            },
          },
        },
      ]);
      throw new BadRequestException('Unable to decrease points');
    }
    this.historyService.createRewardBuyRecord(result, reward);
    return new BuyRewardResponseDto(reward);
  }
}
