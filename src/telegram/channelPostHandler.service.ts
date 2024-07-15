import { Injectable, Logger } from '@nestjs/common';
import { CommunityService } from 'src/communities/community.service';
import { Context, NarrowedContext } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';

@Injectable()
export class ChannelPostHandlerService {
  private readonly logger = new Logger(ChannelPostHandlerService.name);

  constructor(private readonly communityService: CommunityService) {}

  async handle(ctx: NarrowedContext<Context<Update>, Update.ChannelPostUpdate>) {
    this.logger.log('Channel post message', ctx.update);
    if (ctx.update.channel_post.hasOwnProperty('new_chat_photo')) {
      await this.updateChannelPhoto(ctx);
    }
  }

  private async updateChannelPhoto(ctx: NarrowedContext<Context<Update>, Update.ChannelPostUpdate>) {
    const fileId = (ctx.update.channel_post as any)?.new_chat_photo[0]?.file_id;
    const chatId = ctx.update.channel_post.chat.id;
    if (fileId) {
      const fileUrl = await ctx.telegram.getFileLink(fileId);
      await this.communityService.updateCommunityAvatarByChatId(chatId, fileUrl);
    } else {
      this.logger.error(`Unable to get file id from new_chat_photo field for chat ${chatId}`);
    }
  }
}
