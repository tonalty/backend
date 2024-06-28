import { Global, Module } from '@nestjs/common';
import { CommunitiesController } from './communities.controller';
import { CommunityService } from './communities.service';
import { CommunityUserService } from './communityUser.service';

@Global()
@Module({
  controllers: [CommunitiesController],
  providers: [CommunityService, CommunityUserService],
  exports: [CommunityService, CommunityUserService],
})
export class CommunityModule {}
