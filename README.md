# Marketplace

NFT marketplace for [Turbin3 Builders Cohort](https://turbin3.com/).

[Source Repository](https://github.com/ChiefWoods/marketplace)

## Built With

### Languages

- [![Rust](https://img.shields.io/badge/Rust-f75008?style=for-the-badge&logo=rust)](https://www.rust-lang.org/)
- [![TypeScript](https://img.shields.io/badge/TypeScript-ffffff?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

### Libraries

- [@coral-xyz/anchor](https://www.anchor-lang.com/docs)
- [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/)
- [@solana/spl-token](https://solana-labs.github.io/solana-program-library/token/js/)
- [solana-bankrun](https://kevinheavey.github.io/solana-bankrun/)
- [anchor-bankrun](https://kevinheavey.github.io/solana-bankrun/)
- [@metaplex-foundation/mpl-token-metadata](https://developers.metaplex.com/token-metadata)

### Crates

- [anchor-lang](https://docs.rs/anchor-lang/latest/anchor_lang/)
- [anchor-spl](https://docs.rs/anchor-spl/latest/anchor_spl/)

### Test Runner

- [![Bun](https://img.shields.io/badge/Bun-000?style=for-the-badge&logo=bun)](https://bun.sh/)

## Getting Started

### Prerequisites

1. Update your Solana CLI, Bun toolkit and avm to the latest version

```bash
solana-install update
bun upgrade
avm update
```

### Setup

1. Clone the repository

```bash
git clone https://github.com/ChiefWoods/marketplace.git
```

2. Install all dependencies

```bash
bun i
```

3. Resync your program id

```bash
anchor keys sync
```

4. Build the program

```bash
anchor build
```

#### Testing

Run all `.test.ts` files under `/tests`.

```bash
bun test
```

#### Deployment

1. Configure to use localnet

```bash
solana config set -ul
```

2. Deploy the program

```bash
anchor deploy
```

3. Optionally initialize IDL

```bash
anchor idl init -f target/idl/marketplace.json <PROGRAM_ID>
```

## Issues

View the [open issues](https://github.com/ChiefWoods/marketplace/issues) for a full list of proposed features and known bugs.

## Acknowledgements

### Resources

- [Shields.io](https://shields.io/)

## Contact

[chii.yuen@hotmail.com](mailto:chii.yuen@hotmail.com)
