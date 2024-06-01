import { Body, Controller, Get, Headers, Logger, Param, Post, UnauthorizedException } from '@nestjs/common';
import { Community } from '../data/community.entity';
import { CommunitiesService } from './communities.service';
import { CommunityDto } from './dto/communityDto';
import { TmaService } from 'src/tma/tma.service';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UserCommunity } from './interfaces/UserCommunity';

@Controller('communities')
export class CommunitiesController {
  private readonly logger = new Logger(CommunitiesController.name);

  constructor(
    private readonly tmaService: TmaService,
    private readonly communitiesService: CommunitiesService,
    @InjectModel(Community.name) private readonly communityModel: Model<Community>,
  ) {}

  getUserId(tmaInitData: string) {
    this.logger.log('tmaInitData', tmaInitData);

    // eslint-disable-next-line prefer-const
    let webAppInitData: WebAppInitData = { auth_date: 0, hash: '', user: { id: 307294448, first_name: 'dummy' } };
    // try {
    //   webAppInitData = this.tmaService.parseWebAppInitData(tmaInitData);
    // } catch (error) {
    //   this.logger.error('Unable to parse tmaInitData', error);
    //   throw new UnauthorizedException();
    // }

    if (!webAppInitData.user) {
      throw new UnauthorizedException();
    }

    this.logger.log('webAppInitData', webAppInitData);

    return webAppInitData.user.id;
  }

  @Get('user')
  getUserCommunities(@Headers('tmaInitData') tmaInitData: string): Promise<Array<UserCommunity>> {
    return this.communitiesService.getUserCommunities(this.getUserId(tmaInitData));
  }

  @Get('admin')
  getAdminCommunities(@Headers('tmaInitData') tmaInitData: string): Promise<Array<Community>> {
    return this.communitiesService.getAdminCommunities(this.getUserId(tmaInitData));
  }

  @Get(':id')
  async getUserCommunity(
    @Headers('tmaInitData') tmaInitData: string,
    @Param('id') id: number,
  ): Promise<UserCommunity | undefined> {
    const allCommunities = await this.getUserCommunities(tmaInitData);

    const userCommunity = allCommunities.find((userCommunity) => userCommunity.community.chatId === id);

    if (!userCommunity) {
      throw new Error(`No such chat id ${id}`);
    }

    console.log('userCommunity', userCommunity);
    return userCommunity;
  }

  @Post()
  createCommunity(@Body() communityDto: CommunityDto): Promise<any> {
    // return this.communitiesService.createCommunity(communityDto);
    return Promise.resolve();
  }

  @Get('/all')
  getAllCommunities() {
    return this.communityModel.find({});
  }
}
