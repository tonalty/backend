import { Body, Controller, Get, Headers, Logger, Post, UnauthorizedException } from '@nestjs/common';
import { Community } from '../data/community.entity';
import { CommunitiesService } from './communities.service';
import { CommunityDto } from './dto/communityDto';
import { TmaService } from 'src/tma/tma.service';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Controller('community')
export class CommunitiesController {
  private readonly logger = new Logger(CommunitiesController.name);

  constructor(
    private readonly tmaService: TmaService,
    private readonly communitiesService: CommunitiesService,
    @InjectModel(Community.name) private readonly communityModel: Model<Community>,
  ) {}

  @Get()
  getUserCommunities(@Headers('tmaInitData') tmaInitData: string): Promise<Array<Community>> {
    this.logger.log('tmaInitData', tmaInitData);

    let webAppInitData: WebAppInitData = { auth_date: 0, hash: '', user: { id: 307294448, first_name: 'dummy' } };
    try {
      webAppInitData = this.tmaService.parseWebAppInitData(tmaInitData);
    } catch (error) {
      this.logger.error('Unable to parse tmaInitData', error);
      throw new UnauthorizedException();
    }

    if (!webAppInitData.user) {
      throw new UnauthorizedException();
    }

    return this.communitiesService.getUserCommunities(webAppInitData.user?.id);
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
