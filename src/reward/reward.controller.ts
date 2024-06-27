import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CommunitiesService } from 'src/communities/communities.service';
import { TmaService } from 'src/tma/tma.service';
import { AdminRewardDto } from './dto/AdminRewardDto';
import { CreateRewardDto } from './dto/CreateRewardDto';
import { RewardPreview } from './dto/RewardPreviewDto';
import { UserRewardDto } from './dto/UserRewardDto';
import { RewardService } from './reward.service';
import { UpdateRewardDto } from './dto/UpdateRewardDto';
import { ApiBody } from '@nestjs/swagger';

@Controller('reward')
export class RewardController {
  private readonly logger = new Logger(RewardController.name);

  constructor(
    private readonly tmaService: TmaService,
    private readonly rewardsService: RewardService,
    private readonly communitiesService: CommunitiesService,
  ) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('/')
  async createReward(
    @Headers('tmaInitData') tmaInitData: string,
    @Body() rewardDto: CreateRewardDto,
  ): Promise<AdminRewardDto> {
    const userId = this.tmaService.getUserId(tmaInitData);
    await this.communitiesService.validateUserIsAdmin(userId, rewardDto.chatId);
    return this.rewardsService.createReward(rewardDto);
  }

  @HttpCode(HttpStatus.CREATED)
  @Put('/')
  async updateReward(@Headers('tmaInitData') tmaInitData: string, @Body() updateRewardDto: UpdateRewardDto) {
    const userId = this.tmaService.getUserId(tmaInitData);
    await this.communitiesService.validateUserIsAdmin(userId, updateRewardDto.chatId);
    const status = await this.rewardsService.updateReward(updateRewardDto);
    if (!status) {
      throw new BadRequestException('Error during record update');
    }
  }

  @Get('/admin/:rewardId/chat/:chatId')
  async getAdminRewardById(
    @Headers('tmaInitData') tmaInitData: string,
    @Param('rewardId') rewardId: string,
    @Param('chatId') chatId: number,
  ): Promise<AdminRewardDto | UserRewardDto> {
    const userId = this.tmaService.getUserId(tmaInitData);
    await this.communitiesService.validateUserIsAdmin(userId, chatId);
    const result = await this.rewardsService.getAdminReward(rewardId, chatId);
    if (result) {
      return result;
    } else {
      throw new NotFoundException(`Unable to find reward by id ${rewardId} and chatId ${chatId}`);
    }
  }

  @Get('/user/:rewardId/chat/:chatId')
  async getUserRewardById(
    @Headers('tmaInitData') tmaInitData: string,
    @Param('rewardId') rewardId: string,
    @Param('chatId') chatId: number,
  ): Promise<UserRewardDto> {
    const userId = this.tmaService.getUserId(tmaInitData);
    await this.communitiesService.validateCommunityUserPresent(userId, chatId);
    const result = await this.rewardsService.getUserReward(rewardId, chatId);
    if (result) {
      return result;
    } else {
      throw new NotFoundException(`Unable to find reward by id ${rewardId} and chatId ${chatId}`);
    }
  }

  @Get('/chat/:chatId')
  async getRewardsByChatId(
    @Headers('tmaInitData') tmaInitData: string,
    @Param('chatId') chatId: number,
    @Query('page') page: number,
    @Query('size') size: number,
  ): Promise<Array<RewardPreview>> {
    const userId = this.tmaService.getUserId(tmaInitData);
    await this.communitiesService.validateCommunityUserPresent(userId, chatId);
    // check if page and size are valid
    if (isNaN(page) || page < 0 || isNaN(size) || size < 0) {
      throw new BadRequestException('Invalid pagination params. Please supply page and size query fields');
    }
    // do not allow to fetch large slices of the dataset
    if (size > 100) {
      throw new BadRequestException('Invalid pagination params: Max size is 100');
    }
    // calculate pagination parameters
    const limit = size;
    const offset = page * limit;
    this.logger.log(`chatId = ${chatId}`);
    return this.rewardsService.getRewards(chatId, limit, offset);
  }

  @Delete('/:rewardId/chat/:chatId')
  async deleteReward(
    @Headers('tmaInitData') tmaInitData: string,
    @Param('rewardId') rewardId: string,
    @Param('chatId') chatId: number,
  ) {
    const userId = this.tmaService.getUserId(tmaInitData);
    await this.communitiesService.validateUserIsAdmin(userId, chatId);
    const result = await this.rewardsService.deleteReward(rewardId, chatId);
    if (!result) {
      throw new NotFoundException(`Unable to find reward by id ${rewardId} and chatId ${chatId}`);
    }
  }
}
