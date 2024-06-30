import { Global, Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { CommunityUserService } from './communityUser.service';

@Global()
@Module({
  controllers: [CommunityController],
  providers: [CommunityService, CommunityUserService],
  exports: [CommunityService, CommunityUserService],
})
export class CommunityModule {}
