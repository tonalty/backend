import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { Settings } from 'src/data/community.entity';

export class UpdateSettingsDto {
  @ApiProperty()
  @IsNumber()
  chatId: number;

  @ApiProperty()
  @IsOptional()
  // TODO make validation here
  settings: Settings;
}
