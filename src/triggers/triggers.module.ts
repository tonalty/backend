import { Global, Module } from '@nestjs/common';
import { TriggersService } from './triggers.service';
import { TriggersController } from './triggers.controller';

@Global()
@Module({
  controllers: [TriggersController],
  providers: [TriggersService],
  exports: [],
})
export class TriggersModule {}
