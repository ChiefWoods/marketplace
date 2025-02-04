import { BankrunProvider } from "anchor-bankrun";
import { beforeEach, describe, expect, test } from "bun:test";
import { ProgramTestContext } from "solana-bankrun";
import { Marketplace } from "../../target/types/marketplace";
import { AnchorError, Program } from "@coral-xyz/anchor";
import { getBankrunSetup } from "../setup";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { getMarketplacePdaAndBump } from "../pda";
import { getMarketplaceAcc } from "../accounts";

describe("initialize", () => {
  let { context, provider, program } = {} as {
    context: ProgramTestContext;
    provider: BankrunProvider;
    program: Program<Marketplace>;
  };

  const maker = Keypair.generate();

  beforeEach(async () => {
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
    ]));
  });

  test("initialize a marketplace", async () => {
    const name = "Marketplace A";

    await program.methods
      .initialize(name)
      .accounts({
        maker: maker.publicKey,
      })
      .signers([maker])
      .rpc();

    const [marketplacePda, marketplaceBump] = getMarketplacePdaAndBump(name);
    const marketplaceAcc = await getMarketplaceAcc(program, marketplacePda);

    expect(marketplaceBump).toEqual(marketplaceAcc.bump);
    expect(maker.publicKey).toStrictEqual(marketplaceAcc.maker);
    expect(name).toEqual(marketplaceAcc.name);
  });

  test("throws if name exceeds max length", async () => {
    const nameMaxLen = 32;
    const name = "_".repeat(nameMaxLen + 1);

    expect(async () => {
      await program.methods
        .initialize(name)
        .accounts({
          maker: maker.publicKey,
        })
        .signers([maker])
        .rpc();
    }).toThrow();
  });
});
