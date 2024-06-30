import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { IReactionTrigger, IReferralTrigger, ITriggers } from 'src/data/community.entity';

class ReferralTrigger implements IReferralTrigger {
  @ApiProperty()
  @IsNumber()
  inviterPoints: number;
  @ApiProperty()
  @IsNumber()
  inviteePoints: number;
  @ApiProperty()
  @IsBoolean()
  isEnabled: boolean;
}

class ReactionTrigger implements IReactionTrigger {
  @ApiProperty()
  @IsNumber()
  points: number;
  @ApiProperty()
  @IsNumber()
  threshold: number;
  @ApiProperty()
  @IsBoolean()
  isEnabled: boolean;
}

class Triggers implements ITriggers {
  @ApiProperty()
  @ValidateNested()
  @IsOptional()
  @Type(() => ReferralTrigger)
  referral: ReferralTrigger;
  @ApiProperty()
  @ValidateNested()
  @IsOptional()
  @Type(() => ReactionTrigger)
  reaction: ReactionTrigger;
}

export class UpdateTriggersDto {
  @ApiProperty()
  @IsNumber()
  chatId: number;

  @ApiProperty()
  @ValidateNested()
  @Type(() => Triggers)
  triggers: Triggers;
}
