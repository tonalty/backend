export interface MintTokensDto {
  chatId: number;
  name?: string;
  description?: string;
  image?: string;
  symbol?: string;
  tokensToMint: number;
}
