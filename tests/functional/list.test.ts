import { beforeEach, describe, expect, test } from "bun:test";
import { Marketplace } from "../../target/types/marketplace";
import { BN, Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { collectionAddress, mintAddress } from "../constants";
import {
  ACCOUNT_SIZE,
  AccountLayout,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getListingPda, getMarketplacePda } from "../pda";
import { fetchListingAcc } from "../accounts";
import { LiteSVM } from "litesvm";
import { LiteSVMProvider } from "anchor-litesvm";
import { fundedSystemAccountInfo, getSetup } from "../setup";

describe("list", () => {
  let { litesvm, provider, program } = {} as {
    litesvm: LiteSVM;
    provider: LiteSVMProvider;
    program: Program<Marketplace>;
  };

  const maker = Keypair.generate();
  const makerAta = getAssociatedTokenAddressSync(
    mintAddress,
    maker.publicKey,
    false,
    TOKEN_PROGRAM_ID,
  );

  const marketplaceName = "Marketplace A";
  const marketplacePda = getMarketplacePda(marketplaceName);

  beforeEach(async () => {
    const makerAtaData = Buffer.alloc(ACCOUNT_SIZE);
    AccountLayout.encode(
      {
        mint: mintAddress,
        owner: maker.publicKey,
        amount: 1n,
        delegateOption: 0,
        delegate: PublicKey.default,
        delegatedAmount: 0n,
        state: 1,
        isNativeOption: 0,
        isNative: 0n,
        closeAuthorityOption: 0,
        closeAuthority: PublicKey.default,
      },
      makerAtaData,
    );

    ({ litesvm, provider, program } = await getSetup([
      {
        pubkey: maker.publicKey,
        account: fundedSystemAccountInfo(),
      },
      {
        pubkey: makerAta,
        account: {
          lamports: LAMPORTS_PER_SOL,
          data: makerAtaData,
          owner: TOKEN_PROGRAM_ID,
          executable: false,
        },
      },
    ]));

    await program.methods
      .initialize(marketplaceName)
      .accounts({
        maker: maker.publicKey,
      })
      .signers([maker])
      .rpc();
  });

  test("list an item", async () => {
    const price = new BN(0.5 * LAMPORTS_PER_SOL);

    await program.methods
      .list(price)
      .accountsPartial({
        maker: maker.publicKey,
        marketplace: marketplacePda,
        mint: mintAddress,
        collectionMint: collectionAddress,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc();

    const listingPda = getListingPda(marketplacePda, mintAddress);
    const listingAcc = await fetchListingAcc(program, listingPda);

    expect(listingAcc.price.toNumber()).toEqual(price.toNumber());
    expect(listingAcc.maker).toStrictEqual(maker.publicKey);
    expect(listingAcc.mint).toStrictEqual(mintAddress);
    expect(listingAcc.marketplace).toStrictEqual(marketplacePda);

    const vaultPda = getAssociatedTokenAddressSync(
      mintAddress,
      listingPda,
      true,
      TOKEN_PROGRAM_ID,
    );
    const vaultAcc = await getAccount(
      provider.connection,
      vaultPda,
      "processed",
      TOKEN_PROGRAM_ID,
    );

    expect(Number(vaultAcc.amount)).toEqual(1);

    const makerAtaAcc = await getAccount(
      provider.connection,
      makerAta,
      "processed",
      TOKEN_PROGRAM_ID,
    );

    expect(Number(makerAtaAcc.amount)).toEqual(0);
  });
});
