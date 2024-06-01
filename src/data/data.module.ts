import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule, SchemaFactory } from '@nestjs/mongoose';
import { Community } from './community.entity';
import { Message } from './message.entity';
import { User } from './user.entity';

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
          name: Message.name,
          schema: SchemaFactory.createForClass(Message),
        },
        {
          name: User.name,
          schema: SchemaFactory.createForClass(User),
        },
      ]),
    },
  ],
  exports: [],
})
export class DataModule {}
