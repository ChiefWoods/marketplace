use anchor_lang::prelude::*;

#[account]
pub struct Marketplace {
    pub bump: u8,      // 1
    pub maker: Pubkey, // 32
    pub name: String,  // 4
}

impl Marketplace {
    pub fn init_space(name: &str) -> usize {
        1 + 32 + (4 + name.len())
    }
}
