import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reward } from 'src/data/reward.entity';
import { AdminRewardDto } from './dto/AdminRewardDto';
import { CreateRewardDto } from './dto/CreateRewardDto';
import { RewardPreview } from './dto/RewardPreviewDto';
import { UserRewardDto } from './dto/UserRewardDto';
import { TempImageService } from 'src/temp/image/image.service';
import { UpdateRewardDto } from './dto/UpdateRewardDto';

@Injectable()
export class RewardService {
  private readonly logger = new Logger(RewardService.name);

  constructor(
    @InjectModel(Reward.name) private readonly rewardModel: Model<Reward>,
    private readonly tempImageService: TempImageService,
  ) {}

  async createReward(rewardDto: CreateRewardDto): Promise<AdminRewardDto> {
    const rewardId = new Types.ObjectId();
    const imagePublicPath = await this.tempImageService.saveImageToPermanent(rewardDto.imageId, rewardId.toHexString());
    const reward = await this.rewardModel.create({
      _id: rewardId,
      imageUrl: imagePublicPath,
      ...rewardDto,
    });
    return new AdminRewardDto(reward);
  }

  async updateReward(updateRewardDto: UpdateRewardDto): Promise<boolean> {
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

  async getAdminReward(rewardId: string, chatId: number): Promise<AdminRewardDto | null> {
    const reward = await this.rewardModel.findOne({ _id: new Types.ObjectId(rewardId), chatId: chatId });
    if (reward) {
      return new AdminRewardDto(reward);
    } else {
      return reward;
    }
  }

  async getUserReward(rewardId: string, chatId: number): Promise<UserRewardDto | null> {
    const reward = await this.rewardModel.findOne({ _id: new Types.ObjectId(rewardId), chatId: chatId });
    if (reward) {
      return new UserRewardDto(reward);
    } else {
      return reward;
    }
  }

  async getRewards(chatId: number, limit: number, offset: number): Promise<Array<RewardPreview>> {
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

  async deleteReward(rewardId: string, chatId: number): Promise<boolean> {
    const result = await this.rewardModel.deleteOne({ _id: new Types.ObjectId(rewardId), chatId: chatId });
    if (result.deletedCount === 1) {
      return true;
    } else {
      return false;
    }
  }
}
