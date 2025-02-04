use anchor_lang::prelude::*;
use anchor_spl::metadata::mpl_token_metadata::accounts::*;

#[constant]
pub const MARKETPLACE_SEED: &[u8] = b"marketplace";
pub const LISTING_SEED: &[u8] = b"listing";
pub const METADATA_SEED: &[u8] = Metadata::PREFIX;
pub const EDITION_SEED: &[u8] = MasterEdition::PREFIX.1;
pub const NAME_MAX_LEN: usize = 32;
