use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Listing {
    pub bump: u8,
    pub price: u64,
    pub maker: Pubkey,
    pub mint: Pubkey,
    pub marketplace: Pubkey,
}
