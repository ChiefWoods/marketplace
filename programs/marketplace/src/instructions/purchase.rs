use crate::{constants::*, state::*};
use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

#[derive(Accounts)]
pub struct Purchase<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,
    #[account(mut)]
    pub maker: SystemAccount<'info>,
    #[account(
        seeds = [MARKETPLACE_SEED, marketplace.name.as_str().as_bytes()],
        bump = marketplace.bump,
        has_one = maker,
    )]
    pub marketplace: Account<'info, Marketplace>,
    #[account(
        mut,
        close = maker,
        seeds = [LISTING_SEED, marketplace.key().as_ref(), mint.key().as_ref()],
        bump = listing.bump,
        has_one = maker,
        has_one = mint,
        has_one = marketplace,
    )]
    pub listing: Account<'info, Listing>,
    #[account(mint::token_program = token_program)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = listing,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = mint,
        associated_token::authority = taker,
    )]
    pub taker_ata: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl Purchase<'_> {
    pub fn purchase(ctx: Context<Purchase>) -> Result<()> {
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.taker.to_account_info(),
                    to: ctx.accounts.maker.to_account_info(),
                },
            ),
            ctx.accounts.listing.price,
        )?;

        let signer_seeds: &[&[&[u8]]] = &[&[
            LISTING_SEED,
            &ctx.accounts.marketplace.key().to_bytes(),
            &ctx.accounts.mint.key().to_bytes(),
            &[ctx.accounts.listing.bump],
        ]];

        transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    authority: ctx.accounts.listing.to_account_info(),
                    from: ctx.accounts.vault.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.taker_ata.to_account_info(),
                },
                signer_seeds,
            ),
            1,
            ctx.accounts.mint.decimals,
        )?;

        close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.listing.to_account_info(),
                destination: ctx.accounts.maker.to_account_info(),
            },
            signer_seeds,
        ))
    }
}
