import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MintTokensDto } from './dto/MintTokensDto';
import { ClaimTokensDto } from './dto/ClaimTokensDto';
import { Cell, OpenedContract, TonClient, WalletContractV4, toNano } from '@ton/ton';
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

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);

  private readonly mnemonic: string;

  constructor(
    configService: ConfigService,
    @InjectModel(Community.name) private readonly communityModel: Model<Community>,
  ) {
    this.mnemonic = configService.getOrThrow('MNEMONIC');
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
    const tokenMetadata: TokenMetadata = {
      name: mintTokensDto.name,
      description: mintTokensDto.description,
      image: mintTokensDto.image,
      symbol: mintTokensDto.symbol,
    };

    await this.communityModel.updateOne({ chatId: mintTokensDto.chatId }, { tokenMetadata });

    const endpoint = await getHttpEndpoint({ network: 'testnet' });
    const tonClient = new TonClient({ endpoint });

    const keyPair = await mnemonicToWalletKey(this.mnemonic.split(' '));
    const wallet = WalletContractV4.create({
      publicKey: keyPair.publicKey,
      workchain: 0, // https://tonhelloworld.com/01-wallet/#:~:text=Notice%20that%20we%27re,use%20workchain%200.
    });

    const openedWallet = tonClient.open(wallet);
    const seqno = await openedWallet.getSeqno();
    const walletSender = openedWallet.sender(keyPair.secretKey);

    const jettonWalletCode = Cell.fromBoc(Buffer.from(JettonWalletCompiled.hex, 'hex'))[0];
    const jettonMinterCode = Cell.fromBoc(Buffer.from(JettonMinterCompiled.hex, 'hex'))[0];

    const jettonMinter = JettonMinter.createFromConfig(
      {
        owner: wallet.address,
        name: mintTokensDto.name,
        description: mintTokensDto.description,
        image: mintTokensDto.image,
        symbol: mintTokensDto.symbol,
        walletCode: jettonWalletCode,
      },
      jettonMinterCode,
    );

    const openedJettonMinter = tonClient.open(jettonMinter);

    await openedJettonMinter.sendDeploy(
      walletSender,
      toNano(0.25),
      JettonMinter.mintMessage(wallet.address, wallet.address, toNano(mintTokensDto.tokensToMint), 0n, toNano(0.2)),
    );

    await TokensService.waitForTransaction(openedWallet, seqno);
  }

  async claimTokens(userId: number, claimTokensDto: ClaimTokensDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
