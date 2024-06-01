import { Module } from '@nestjs/common';
import { Community } from '../data/community.entity';
import { CommunitiesController } from './communities.controller';
import { CommunitiesService } from './communities.service';
import { MongooseModule, SchemaFactory } from '@nestjs/mongoose';
import { Message } from 'src/data/message.entity';
import { User } from 'src/data/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
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
  ],
  controllers: [CommunitiesController],
  providers: [CommunitiesService],
})
export class CommunityModule {}
