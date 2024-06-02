import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MintTokensDto } from './dto/MintTokensDto';
import { ClaimTokensDto } from './dto/ClaimTokensDto';
import { Address, Cell, OpenedContract, Sender, TonClient, WalletContractV4, toNano } from '@ton/ton';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { mnemonicToWalletKey } from '@ton/crypto';
import * as JettonMinterCompiled from './JettonMinter.compiled.json';
import * as JettonWalletCompiled from './JettonWallet.compiled.json';
import { JettonMinter } from './JettonMinter';
import { JettonWallet } from './JettonWallet';
import { InjectModel } from '@nestjs/mongoose';
import { Community } from 'src/data/community.entity';
import { Model } from 'mongoose';
import { TokenMetadata } from 'src/data/tokenMetadata.entity';
import { CommunitiesService } from 'src/communities/communities.service';

@Injectable()
export class TokensService implements OnModuleInit {
  private readonly logger = new Logger(TokensService.name);

  private readonly mnemonic: string;

  constructor(
    configService: ConfigService,
    @InjectModel(Community.name) private readonly communityModel: Model<Community>,
    private readonly communitiesService: CommunitiesService,
  ) {
    this.mnemonic = configService.getOrThrow('MNEMONIC');
  }

  private tonClient: TonClient;
  private openedWallet: OpenedContract<WalletContractV4>;
  private walletSender: Sender;

  async onModuleInit() {
    const keyPair = await mnemonicToWalletKey(this.mnemonic.split(' '));
    const wallet = WalletContractV4.create({
      publicKey: keyPair.publicKey,
      workchain: 0, // https://tonhelloworld.com/01-wallet/#:~:text=Notice%20that%20we%27re,use%20workchain%200.
    });

    const endpoint = await getHttpEndpoint({ network: 'testnet' });
    this.tonClient = new TonClient({ endpoint });

    this.openedWallet = this.tonClient.open(wallet);
    this.walletSender = this.openedWallet.sender(keyPair.secretKey);
  }

  async getMetadata(chatId: number) {
    const community = await this.communityModel.findOne({ chatId });

    if (!community || !community.tokenMetadata) {
      throw new NotFoundException();
    }

    return community.tokenMetadata;
  }

  static sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async waitForTransaction(openedWallet: OpenedContract<WalletContractV4>, seqno: number) {
    let currentSeqno = seqno;
    while (currentSeqno === seqno) {
      console.log('waiting for transaction to confirm...');
      await TokensService.sleep(1500);
      currentSeqno = await openedWallet.getSeqno();
    }
  }

  async mintTokens(mintTokensDto: MintTokensDto) {
    const community = await this.communityModel.findOne({ chatId: mintTokensDto.chatId });
    if (!community) {
      throw new BadRequestException();
    }
    if (community.tokenAddress) {
      // ToDo: support more minting
      //return;
    }

    const seqno = await this.openedWallet.getSeqno();

    const jettonWalletCode = Cell.fromBoc(Buffer.from(JettonWalletCompiled.hex, 'hex'))[0];
    const jettonMinterCode = Cell.fromBoc(Buffer.from(JettonMinterCompiled.hex, 'hex'))[0];

    const jettonMinter = JettonMinter.createFromConfig(
      {
        owner: this.openedWallet.address,
        name: mintTokensDto.name,
        description: mintTokensDto.description,
        image: mintTokensDto.image,
        symbol: mintTokensDto.symbol,
        walletCode: jettonWalletCode,
      },
      jettonMinterCode,
    );

    const openedJettonMinter = this.tonClient.open(jettonMinter);

    await openedJettonMinter.sendDeploy(
      this.walletSender,
      toNano(0.25),
      JettonMinter.mintMessage(
        this.openedWallet.address,
        this.openedWallet.address,
        toNano(mintTokensDto.tokensToMint),
        0n,
        toNano(0.2),
      ),
    );

    await TokensService.waitForTransaction(this.openedWallet, seqno);

    const tokenMetadata: TokenMetadata = {
      name: mintTokensDto.name,
      description: mintTokensDto.description,
      image: mintTokensDto.image,
      symbol: mintTokensDto.symbol,
    };

    await this.communityModel.updateOne(
      { chatId: mintTokensDto.chatId },
      { tokenMetadata, tokenAddress: jettonMinter.address.toString() },
    );
  }

  async claimTokens(userId: number, claimTokensDto: ClaimTokensDto): Promise<any> {
    const community = await this.communityModel.findOne({ chatId: claimTokensDto.chatId });
    if (!community || !community.tokenAddress) {
      throw new BadRequestException();
    }

    const points = await this.communitiesService.getUserPoints(userId, claimTokensDto.chatId);
    if (!(points > 0)) {
      throw new BadRequestException('No points avalable');
    }

    // ToDo: mark points as claimed somehow :)

    const seqno = await this.openedWallet.getSeqno();

    const openedJettonMinter = this.tonClient.open(
      JettonMinter.createFromAddress(Address.parse(community.tokenAddress)),
    );

    const walletAddress = await openedJettonMinter.getWalletAddress(this.openedWallet.address);

    const openedJettonWallet = this.tonClient.open(JettonWallet.createFromAddress(walletAddress));

    const isJettonWalletDeployed = await this.tonClient.isContractDeployed(openedJettonWallet.address);

    const toAddress = Address.parse(claimTokensDto.toAddress);
    if (isJettonWalletDeployed) {
      await openedJettonWallet.sendTransfer(
        this.walletSender,
        toNano(0.2),
        toNano(points),
        toAddress,
        this.openedWallet.address,
        null,
        toNano(0.1),
        null,
      );
    } else {
      openedJettonWallet.sendDeploy(
        this.walletSender,
        toNano(0.25),
        JettonWallet.transferMessage(toNano(points), toAddress, this.openedWallet.address, null, toNano(0.1), null),
      );
    }

    await TokensService.waitForTransaction(this.openedWallet, seqno);
  }
}
