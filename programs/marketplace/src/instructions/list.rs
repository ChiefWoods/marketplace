use crate::{constants::*, state::*};
use anchor_lang::{prelude::*, Discriminator};
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{MasterEditionAccount, Metadata, MetadataAccount},
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

#[derive(Accounts)]
pub struct List<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(
        seeds = [MARKETPLACE_SEED, marketplace.name.as_str().as_bytes()],
        bump = marketplace.bump,
        has_one = maker,
    )]
    pub marketplace: Account<'info, Marketplace>,
    #[account(
        init,
        payer = maker,
        space = Listing::DISCRIMINATOR.len() + Listing::INIT_SPACE,
        seeds = [LISTING_SEED, marketplace.key().as_ref(), mint.key().as_ref()],
        bump,
    )]
    pub listing: Account<'info, Listing>,
    #[account(
        seeds = [
            METADATA_SEED,
            metadata_program.key().as_ref(),
            mint.key().as_ref()
        ],
        seeds::program = metadata_program.key(),
        bump,
        constraint = metadata.collection.as_ref().unwrap().key.as_ref() == collection_mint.key().as_ref(),
        constraint = metadata.collection.as_ref().unwrap().verified == true,
    )]
    pub metadata: Box<Account<'info, MetadataAccount>>,
    #[account(
        seeds = [
            METADATA_SEED,
            metadata_program.key().as_ref(),
            mint.key().as_ref(),
            EDITION_SEED,
        ],
        seeds::program = metadata_program.key(),
        bump,
    )]
    pub master_edition: Box<Account<'info, MasterEditionAccount>>,
    #[account(mint::token_program = token_program)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mint::token_program = token_program)]
    pub collection_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = maker,
    )]
    pub maker_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init,
        payer = maker,
        associated_token::mint = mint,
        associated_token::authority = listing,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    pub metadata_program: Program<'info, Metadata>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl List<'_> {
    pub fn list(ctx: Context<List>, price: u64) -> Result<()> {
        ctx.accounts.listing.set_inner(Listing {
            bump: ctx.bumps.listing,
            price,
            maker: ctx.accounts.maker.key(),
            mint: ctx.accounts.mint.key(),
            marketplace: ctx.accounts.marketplace.key(),
        });

        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    authority: ctx.accounts.maker.to_account_info(),
                    from: ctx.accounts.maker_ata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            1,
            ctx.accounts.mint.decimals,
        )
    }
}
