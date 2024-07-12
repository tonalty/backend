import { Global, Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsControler } from './settings.controller';

@Global()
@Module({
  controllers: [SettingsControler],
  providers: [SettingsService],
  exports: [],
})
export class SettingsModule {}
