import { BankrunProvider } from "anchor-bankrun";
import { beforeEach, describe, expect, test } from "bun:test";
import { ProgramTestContext } from "solana-bankrun";
import { Marketplace } from "../../target/types/marketplace";
import { BN, Program } from "@coral-xyz/anchor";
import { getBankrunSetup } from "../setup";
import {
  ACCOUNT_SIZE,
  AccountLayout,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { collectionAddress, mintAddress } from "../constants";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { getListingPdaAndBump, getMarketplacePdaAndBump } from "../pda";

describe("purchase", () => {
  let { context, provider, program } = {} as {
    context: ProgramTestContext;
    provider: BankrunProvider;
    program: Program<Marketplace>;
  };

  const [maker, taker] = Array.from({ length: 2 }, () => Keypair.generate());
  const makerAta = getAssociatedTokenAddressSync(
    mintAddress,
    maker.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  const marketplaceName = "Marketplace A";
  const [marketplacePda] = getMarketplacePdaAndBump(marketplaceName);

  const [listingPda] = getListingPdaAndBump(marketplacePda, mintAddress);

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
      makerAtaData
    );

    ({ context, provider, program } = await getBankrunSetup([
      {
        address: maker.publicKey,
        info: {
          lamports: LAMPORTS_PER_SOL * 5,
          data: Buffer.alloc(0),
          owner: SystemProgram.programId,
          executable: false,
        },
      },
      {
        address: taker.publicKey,
        info: {
          lamports: LAMPORTS_PER_SOL * 5,
          data: Buffer.alloc(0),
          owner: SystemProgram.programId,
          executable: false,
        },
      },
      {
        address: makerAta,
        info: {
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
      .list(new BN(LAMPORTS_PER_SOL))
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

  test("purchase an item", async () => {
    await program.methods
      .purchase()
      .accountsPartial({
        taker: taker.publicKey,
        marketplace: marketplacePda,
        listing: listingPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([taker])
      .rpc();

    const listingAcc = await context.banksClient.getAccount(listingPda);

    expect(listingAcc).toBeNull();

    const takerAta = getAssociatedTokenAddressSync(
      mintAddress,
      taker.publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    const takerAtaAcc = await getAccount(
      provider.connection,
      takerAta,
      "processed",
      TOKEN_PROGRAM_ID
    );

    expect(Number(takerAtaAcc.amount)).toEqual(1);

    const vaultPda = getAssociatedTokenAddressSync(
      mintAddress,
      listingPda,
      true,
      TOKEN_PROGRAM_ID
    );
    const vaultAcc = await context.banksClient.getAccount(vaultPda);

    expect(vaultAcc).toBeNull();
  });
});
