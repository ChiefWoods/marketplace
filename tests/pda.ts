import { PublicKey } from "@solana/web3.js";
import idl from "../target/idl/marketplace.json";

export function getMarketplacePdaAndBump(name: string) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace"), Buffer.from(name)],
    new PublicKey(idl.address)
  );
}

export function getListingPdaAndBump(
  marketplacePda: PublicKey,
  mint: PublicKey
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("listing"), marketplacePda.toBuffer(), mint.toBuffer()],
    new PublicKey(idl.address)
  );
}
