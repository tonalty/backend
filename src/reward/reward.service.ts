import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CommunitiesService } from 'src/communities/communities.service';
import { Reward } from 'src/data/reward.entity';
import { HistoryService } from 'src/history/history.service';
import { TempImageService } from 'src/temp/image/image.service';
import { AdminRewardDto } from './dto/AdminRewardDto';
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
    private readonly communitiesService: CommunitiesService,
    private readonly historyService: HistoryService,
  ) {}

  async createReward(userId: number, rewardDto: CreateRewardDto): Promise<AdminRewardDto> {
    await this.communitiesService.validateUserIsAdmin(userId, rewardDto.chatId);
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
    await this.communitiesService.validateUserIsAdmin(userId, updateRewardDto.chatId);
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
    await this.communitiesService.validateUserIsAdmin(userId, chatId);
    const reward = await this.rewardModel.findOne({ _id: new Types.ObjectId(rewardId), chatId: chatId });
    if (reward) {
      return new AdminRewardDto(reward);
    } else {
      return reward;
    }
  }

  async getUserReward(userId: number, rewardId: string, chatId: number): Promise<UserRewardDto | null> {
    await this.communitiesService.validateCommunityUserPresent(userId, chatId);
    const reward = await this.rewardModel.findOne({ _id: new Types.ObjectId(rewardId), chatId: chatId });
    if (reward) {
      return new UserRewardDto(reward);
    } else {
      return reward;
    }
  }

  async getRewards(userId: number, chatId: number, limit: number, offset: number): Promise<Array<RewardPreview>> {
    await this.communitiesService.validateCommunityUserPresent(userId, chatId);
    const rewards = await this.rewardModel.find(
      { chatId: chatId },
      { _id: 1, imageUrl: 1, title: 1, value: 1 },
      { m: limit, skip: offset },
    );
    if (rewards) {
      return rewards.map((reward) => new RewardPreview(reward));
    } else {
      throw new BadRequestException('Error during reward request');
    }
  }

  async deleteReward(userId: number, rewardId: string, chatId: number): Promise<boolean> {
    await this.communitiesService.validateUserIsAdmin(userId, chatId);
    const result = await this.rewardModel.deleteOne({ _id: new Types.ObjectId(rewardId), chatId: chatId });
    if (result.deletedCount === 1) {
      return true;
    } else {
      return false;
    }
  }

  async buyReward(rewardId: string, chatId: number, userId: number) {
    const reward = await this.rewardModel.findOne({ _id: new Types.ObjectId(rewardId), chatId: chatId });
    if (!reward) {
      throw new NotFoundException(`Unable to find reward by id ${rewardId} in chat ${chatId}`);
    }
    const result = await this.communitiesService.decreaseCommunityUserPoints(userId, chatId, reward.value);
    if (!result) {
      throw new BadRequestException('Unable to decrease points');
    }
    this.historyService.createRewardBuyRecord(userId, chatId, reward);
  }
}
