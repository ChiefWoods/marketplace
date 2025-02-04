use anchor_lang::prelude::*;

#[error_code]
pub enum MarketplaceError {
    #[msg("Name must be no longer than 32 characters")]
    NameExceededMaxLength,
}
