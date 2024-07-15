import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configValidationSchema } from './config.schema';
import { TelegramModule } from './telegram/telegram.module';
import { CommunityModule } from './communities/community.module';
import { DataModule } from './data/data.module';
import { TmaModule } from './tma/tma.module';
import { TokensModule } from './tokens/tokens.module';
import { ReferralsModule } from './referrals/referrals.module';
import { HistoryModule } from './history/history.module';
import { TriggersModule } from './triggers/triggers.module';
import { RewardModule } from './reward/reward.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TempImageModule } from './temp/image/image.module';
import { join } from 'path';
import { DownloaderModule } from './util/downloader/downloader.module';
import { MessageHandlerService } from './telegram/messageHandler.service';
import { ReactionHandlerService } from './telegram/reactionHandler.service';
import { ChatMemberHandlerService } from './telegram/chatMemberHandler.service';
import { MyChatMemberHandlerService } from './telegram/myChatMemberHandler.service';
import { TelegramService } from './telegram/telegram.service';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './util/exception/AllExceptionFilter';
import { ChannelPostHandlerService } from './telegram/channelPostHandler.service';

export const PUBLIC_FS_DIRECTORY = join(__dirname, '..', 'public');
export const PUBLIC_FS_IMAGE_DIRECTORY = join(PUBLIC_FS_DIRECTORY, 'image');
export const PUBLIC_FS_COMMUNITY_AVATAR_DIRECTORY = join(PUBLIC_FS_DIRECTORY, 'communityAvatar');
export const PUBLIC_ENDPOINT = '/backend/public/';
export const PUBLIC_IMAGE_ENDPOINT = join(PUBLIC_ENDPOINT, 'image');
export const PUBLIC_COMMUNITY_AVATAR_ENDPOINT = join(PUBLIC_ENDPOINT, 'communityAvatar');

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`stage.${process.env.STAGE}.env`],
      validationSchema: configValidationSchema,
      isGlobal: true,
    }),
    TmaModule,
    TelegramModule,
    CommunityModule,
    DataModule,
    TokensModule,
    ReferralsModule,
    HistoryModule,
    TriggersModule,
    RewardModule,
    ServeStaticModule.forRoot({
      rootPath: PUBLIC_FS_DIRECTORY,
      serveRoot: PUBLIC_ENDPOINT,
    }),
    TempImageModule,
    DownloaderModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TelegramService,
    MessageHandlerService,
    ReactionHandlerService,
    ChatMemberHandlerService,
    MyChatMemberHandlerService,
    ChannelPostHandlerService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
