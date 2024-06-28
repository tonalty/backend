import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configValidationSchema } from './config.schema';
import { TelegramModule } from './telegram/telegram.module';
import { CommunityModule } from './communities/communities.module';
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

export const PUBLIC_FS_DIRECTORY = join(__dirname, '..', 'public');
export const PUBLIC_FS_IMAGE_DIRECTORY = join(PUBLIC_FS_DIRECTORY, 'image');
export const PUBLIC_ENDPOINT = '/backend/public/';
export const PUBLIC_IMAGE_ENDPOINT = join(PUBLIC_ENDPOINT, 'image');

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
