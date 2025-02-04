pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use error::MarketplaceError;
pub use instructions::*;
pub use state::*;

declare_id!("Cdd1rsJA156FtUjfV3osquKKeXtRG5fxfL2PsF44TdMd");

#[program]
pub mod marketplace {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, name: String) -> Result<()> {
        require!(
            name.len() <= NAME_MAX_LEN,
            MarketplaceError::NameExceededMaxLength
        );

        Initialize::initialize(ctx, name)
    }

    pub fn list(ctx: Context<List>, price: u64) -> Result<()> {
        List::list(ctx, price)
    }

    pub fn delist(ctx: Context<Delist>) -> Result<()> {
        Delist::delist(ctx)
    }

    pub fn purchase(ctx: Context<Purchase>) -> Result<()> {
        Purchase::purchase(ctx)
    }
}
