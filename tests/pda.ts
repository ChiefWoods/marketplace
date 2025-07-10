import { PublicKey } from "@solana/web3.js";
import idl from "../target/idl/marketplace.json";

const MARKETPLACE_PROGRAM_ID = new PublicKey(idl.address);

export function getMarketplacePda(name: string) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace"), Buffer.from(name)],
    MARKETPLACE_PROGRAM_ID,
  )[0];
}

export function getListingPda(marketplacePda: PublicKey, mint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("listing"), marketplacePda.toBuffer(), mint.toBuffer()],
    MARKETPLACE_PROGRAM_ID,
  )[0];
}
