import { ApiProperty } from '@nestjs/swagger';

export class CreateTempImageDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: Buffer;
}
