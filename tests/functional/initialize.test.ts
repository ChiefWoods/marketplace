import { beforeEach, describe, expect, test } from "bun:test";
import { Marketplace } from "../../target/types/marketplace";
import { Program } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { getMarketplacePda } from "../pda";
import { fetchMarketplaceAcc } from "../accounts";
import { LiteSVM } from "litesvm";
import { LiteSVMProvider } from "anchor-litesvm";
import { fundedSystemAccountInfo, getSetup } from "../setup";

describe("initialize", () => {
  let { litesvm, provider, program } = {} as {
    litesvm: LiteSVM;
    provider: LiteSVMProvider;
    program: Program<Marketplace>;
  };

  const maker = Keypair.generate();

  beforeEach(async () => {
    ({ litesvm, provider, program } = await getSetup([
      {
        pubkey: maker.publicKey,
        account: fundedSystemAccountInfo(),
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

    const marketplacePda = getMarketplacePda(name);
    const marketplaceAcc = await fetchMarketplaceAcc(program, marketplacePda);

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
