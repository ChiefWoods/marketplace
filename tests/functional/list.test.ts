import { BankrunProvider } from "anchor-bankrun";
import { beforeEach, describe, expect, test } from "bun:test";
import { ProgramTestContext } from "solana-bankrun";
import { Marketplace } from "../../target/types/marketplace";
import { BN, Program } from "@coral-xyz/anchor";
import { getBankrunSetup } from "../setup";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { collectionAddress, mintAddress } from "../constants";
import {
  ACCOUNT_SIZE,
  AccountLayout,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getListingPdaAndBump, getMarketplacePdaAndBump } from "../pda";
import { getListingAcc } from "../accounts";

describe("list", () => {
  let { context, provider, program } = {} as {
    context: ProgramTestContext;
    provider: BankrunProvider;
    program: Program<Marketplace>;
  };

  const maker = Keypair.generate();
  const makerAta = getAssociatedTokenAddressSync(
    mintAddress,
    maker.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  const marketplaceName = "Marketplace A";
  const [marketplacePda] = getMarketplacePdaAndBump(marketplaceName);

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
  });

  test("list an item", async () => {
    const price = new BN(LAMPORTS_PER_SOL);

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

    const [listingPda, listingBump] = getListingPdaAndBump(
      marketplacePda,
      mintAddress
    );
    const listingAcc = await getListingAcc(program, listingPda);

    expect(listingBump).toEqual(listingAcc.bump);
    expect(listingAcc.price.toNumber()).toEqual(price.toNumber());
    expect(listingAcc.maker).toStrictEqual(maker.publicKey);
    expect(listingAcc.mint).toStrictEqual(mintAddress);
    expect(listingAcc.marketplace).toStrictEqual(marketplacePda);

    const vaultPda = getAssociatedTokenAddressSync(
      mintAddress,
      listingPda,
      true,
      TOKEN_PROGRAM_ID
    );
    const vaultAcc = await getAccount(
      provider.connection,
      vaultPda,
      "processed",
      TOKEN_PROGRAM_ID
    );

    expect(Number(vaultAcc.amount)).toEqual(1);

    const makerAtaAcc = await getAccount(
      provider.connection,
      makerAta,
      "processed",
      TOKEN_PROGRAM_ID
    );

    expect(Number(makerAtaAcc.amount)).toEqual(0);
  });
});
