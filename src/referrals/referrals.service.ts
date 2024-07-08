import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { CommunityService } from 'src/communities/community.service';
import { Community } from 'src/data/community.entity';
import { CommunityUser } from 'src/data/communityUser.entity';
import { CommunityUserHistory, ReferralJoinData } from 'src/data/communityUserHistory.entity';
import { Referral } from 'src/data/referral.entity';

export interface TgWebAppStartParam {
  ['#tgWebAppData']: string;
  tgWebAppPlatform: string;
  tgWebAppThemeParams: string;
  tgWebAppVersion: string;
}

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);
  private readonly botToken: string;
  private readonly botName;
  private readonly webAppName;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly communityService: CommunityService,

    @InjectModel(Referral.name) private readonly referralModel: Model<Referral>,
    @InjectModel(CommunityUser.name) protected communityUserModel: Model<CommunityUser>,
    @InjectModel(Community.name) protected communityModel: Model<Community>,
    @InjectModel(CommunityUserHistory.name) protected communityUserHistoryModel: Model<CommunityUserHistory>,
  ) {
    this.botToken = this.configService.getOrThrow('BOT_TOKEN');
    this.botName = this.configService.getOrThrow('BOT_NAME');
    this.webAppName = this.configService.getOrThrow('WEB_APP_NAME');
  }

  async generateReferral(userId: number, chatId: number, title: string, name: string): Promise<string> {
    this.logger.log('this.botToken', this.botToken);
    this.logger.log('this.botName', this.botName);
    this.logger.log('this.webAppName', this.webAppName);
    const referral = await this.referralModel.findOne({
      chatId: chatId,
      ownerId: userId,
    });

    if (referral === null) {
      const community = await this.communityModel.findOne({ chatId: chatId });

      if (!community) {
        this.logger.error('Failed to find community when generating referral');

        throw new Error('Failed to find community when generating referral');
      }

      const params = { ownerId: userId, title, name, telegramInviteLink: community?.inviteLink, chatId };
      const link = this.createReferralLink(params);

      try {
        await this.referralModel.create({
          chatId: chatId,
          ownerId: userId,
          ownerName: name,
          link,
          inviteLink: community?.inviteLink,
        });

        return Promise.resolve(link);
      } catch (error) {
        throw new Error(`Failed to update referral ${error}`);
      }
    }

    return Promise.resolve(referral.link);
  }

  async generateInviteLink(chatId: number): Promise<string> {
    let inviteLinkResponse;

    const _id = new mongoose.Types.ObjectId().toString();

    this.logger.log('_id generated', _id);

    try {
      // create only once
      inviteLinkResponse = await this.httpService.axiosRef.post(
        `https://api.telegram.org/bot${this.botToken}/createChatInviteLink`,
        {
          chat_id: chatId,
          creates_join_request: false,
          name: `${_id}`,
        },
      );
    } catch (error) {
      this.logger.error('Error while retrieving telegram invite link check that bot has admin rights!!!', error);
    }

    if (!inviteLinkResponse) {
      throw new Error('Could not recieve telegram invite link');
    }

    const {
      data: {
        result: { invite_link: telegramInviteLink },
      },
    } = inviteLinkResponse;

    return telegramInviteLink;
  }

  createReferralLink(params: unknown) {
    const payload = Buffer.from(JSON.stringify(params)).toString('base64').replace(/=+$/, '');

    return `https://t.me/${this.botName}/${this.webAppName}?startapp=${encodeURIComponent(payload)}`;
  }

  decodeStartParam(startParam: string) {
    this.logger.log('decodeStartParam', startParam);

    const payload = decodeURIComponent(startParam);

    return Buffer.from(payload, 'base64').toString();
  }

  async joinUserByReferralLink(currentUser: WebAppUser, chatId: number, ownerId: number, title: string) {
    this.logger.log('currentUser, chatId, ownerId, title', JSON.stringify(currentUser), chatId, ownerId, title);
    const referral = await this.referralModel.findOne({ chatId, ownerId });

    if (!referral) {
      throw new Error(`Could not find referral with by inviteLink`);
    }

    if (!currentUser.id) {
      throw new Error('Joined user does not have id');
    }

    if (currentUser.is_bot) {
      throw new Error('Joined user is bot');
    }

    if (referral.ownerId === currentUser.id) {
      throw new Error('Owner id of the link is the same as user id, so points would not be assigned');
    }

    let referralUpdate;
    try {
      referralUpdate = await this.referralModel.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(referral._id),
          // only update visitorIds if we do not have this user previously else return null
          visitorIds: {
            $ne: currentUser.id,
          },
        },
        { $addToSet: { visitorIds: currentUser.id } },
      );
    } catch (error) {
      throw new Error(`Error while adding user to visitors ${error}`);
    }

    this.logger.log('referral', JSON.stringify(referral));
    this.logger.log('referralUpdate', JSON.stringify(referralUpdate));

    if (!referralUpdate) {
      throw new Error(`This user with id ${currentUser.id} had already recieved points`);
    }

    let communityUser;
    let triggers;

    try {
      triggers = (await this.communityModel.findOne({ chatId: chatId }, { triggers: 1 }))?.triggers;
    } catch (error) {
      this.logger.log(error);
    }

    if (!triggers) {
      throw new Error('No triggers recieved');
    }

    this.logger.log('referral', JSON.stringify(referral.ownerId));
    // replace
    try {
      communityUser = await this.communityUserModel.bulkWrite([
        {
          updateOne: {
            filter: {
              userId: referral.ownerId,
              chatId: chatId,
            },
            update: {
              $inc: { points: triggers.referral.inviterPoints },
              communityName: title,
            },
            upsert: true,
          },
        },
        {
          updateOne: {
            filter: {
              userId: currentUser.id,
              chatId: chatId,
            },
            update: {
              $inc: { points: triggers.referral.inviteePoints },
              communityName: title,
            },
            upsert: true,
          },
        },
      ]);
      this.communityService.increaseMemberCounter(chatId);
    } catch (error) {
      throw new Error(`Error while increasing points ${error}`);
    }

    this.logger.log('communityUser', communityUser);

    if (communityUser.insertedCount || communityUser.upsertedCount) {
      try {
        const firstCommunityUser = await this.communityUserModel.findOne(
          { userId: referral.ownerId, chatId: chatId },
          { _id: 1 },
        );
        const secondCommunityUser = await this.communityUserModel.findOne(
          { userId: currentUser.id, chatId: chatId },
          { _id: 1 },
        );
        if (!firstCommunityUser || !secondCommunityUser) {
          throw Error('Unable to write history as communityUser not found');
        }
        // TODO: CHECK CHAT HISTORY
        // right now only add points to owner of the link
        await this.communityUserHistoryModel.insertMany([
          {
            communityUserId: firstCommunityUser._id,
            data: new ReferralJoinData(
              referral.ownerId,
              referral.chatId,
              triggers.referral.inviterPoints,
              currentUser.username || currentUser.first_name || String(currentUser.id),
              true,
            ),
          },
          {
            communityUserId: secondCommunityUser._id,
            data: new ReferralJoinData(
              currentUser.id,
              chatId,
              triggers.referral.inviteePoints,
              currentUser.username || currentUser.first_name || String(currentUser.id),
              false,
            ),
          },
        ]);
      } catch (error) {
        throw new Error(`Error while adding user history record ${error}`);
      }
    }
    this.logger.log('Points were succesfully sent');

    return { success: true };
  }
}
