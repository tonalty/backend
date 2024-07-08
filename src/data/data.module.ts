import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule, SchemaFactory } from '@nestjs/mongoose';
import { Community } from './community.entity';
import { CommunityUser, CommunityUserSchema } from './communityUser.entity';
import { CommunityUserHistory, CommunityUserHistorySchema } from './communityUserHistory.entity';
import { Message } from './message.entity';
import { Referral } from './referral.entity';
import { Reward, RewardSchema } from './reward.entity';
import { TempImage, TempImageSchema } from './tempImage.entity';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow('DB_URL'),
      }),
    }),
    {
      global: true,
      ...MongooseModule.forFeature([
        {
          name: Community.name,
          schema: SchemaFactory.createForClass(Community),
        },
        {
          name: CommunityUser.name,
          schema: CommunityUserSchema,
        },
        {
          name: CommunityUserHistory.name,
          schema: CommunityUserHistorySchema,
        },
        {
          name: Message.name,
          schema: SchemaFactory.createForClass(Message),
        },
        {
          name: Referral.name,
          schema: SchemaFactory.createForClass(Referral),
        },
        {
          name: Reward.name,
          schema: RewardSchema,
        },
        {
          name: TempImage.name,
          schema: TempImageSchema,
        },
      ]),
    },
  ],
  exports: [],
})
export class DataModule {}
