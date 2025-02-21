use anchor_lang::{prelude::*, Discriminator};

#[account]
pub struct Marketplace {
    pub bump: u8,      // 1
    pub maker: Pubkey, // 32
    pub name: String,  // 4
}

impl Marketplace {
    pub const MIN_SPACE: usize = Marketplace::DISCRIMINATOR.len() + 1 + 32 + 4;
}
