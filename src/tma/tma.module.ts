import { Global, Module } from '@nestjs/common';
import { TmaService } from './tma.service';

@Global()
@Module({
  providers: [TmaService],
  exports: [TmaService],
})
export class TmaModule {}
