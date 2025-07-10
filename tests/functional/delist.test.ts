import { beforeEach, describe, expect, test } from "bun:test";
import { Marketplace } from "../../target/types/marketplace";
import { BN, Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  ACCOUNT_SIZE,
  AccountLayout,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { collectionAddress, mintAddress } from "../constants";
import { getListingPda, getMarketplacePda } from "../pda";
import { fundedSystemAccountInfo, getSetup } from "../setup";
import { LiteSVM } from "litesvm";
import { LiteSVMProvider } from "anchor-litesvm";

describe("delist", () => {
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

  const listingPda = getListingPda(marketplacePda, mintAddress);

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

    await program.methods
      .list(new BN(0.5 * LAMPORTS_PER_SOL))
      .accountsPartial({
        maker: maker.publicKey,
        mint: mintAddress,
        collectionMint: collectionAddress,
        tokenProgram: TOKEN_PROGRAM_ID,
        marketplace: marketplacePda,
      })
      .signers([maker])
      .rpc();
  });

  test("delist an item", async () => {
    await program.methods
      .delist()
      .accountsPartial({
        maker: maker.publicKey,
        marketplace: marketplacePda,
        listing: listingPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc();

    const listingAcc = litesvm.getBalance(listingPda);

    expect(listingAcc).toBe(0n);

    const makerAtaAcc = await getAccount(
      provider.connection,
      makerAta,
      "processed",
      TOKEN_PROGRAM_ID,
    );

    expect(Number(makerAtaAcc.amount)).toEqual(1);

    const vaultPda = getAssociatedTokenAddressSync(
      mintAddress,
      listingPda,
      true,
      TOKEN_PROGRAM_ID,
    );
    const vaultAcc = litesvm.getBalance(vaultPda);

    expect(vaultAcc).toBe(0n);
  });
});
