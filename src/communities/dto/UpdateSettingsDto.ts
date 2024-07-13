import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

class Settings {
  @ApiProperty({ type: Boolean })
  isTonConnectWallet: boolean;
}

export class UpdateSettingsDto {
  @ApiProperty()
  @IsNumber()
  chatId: number;

  @ApiProperty()
  @IsOptional()
  @Type(() => Settings)
  settings: Settings;
}

export interface IUpdateSettingsDto {
  chatId: number;
  settings: Settings;
}
