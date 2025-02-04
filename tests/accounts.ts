import { PublicKey } from "@solana/web3.js";
import { Marketplace } from "../target/types/marketplace";
import { Program } from "@coral-xyz/anchor";

export async function getMarketplaceAcc(
  program: Program<Marketplace>,
  marketplacePda: PublicKey
) {
  return await program.account.marketplace.fetchNullable(marketplacePda);
}

export async function getListingAcc(
  program: Program<Marketplace>,
  listingPda: PublicKey
) {
  return await program.account.listing.fetchNullable(listingPda);
}
