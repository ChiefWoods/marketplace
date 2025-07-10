use anchor_lang::prelude::*;

use crate::{Marketplace, MARKETPLACE_SEED};

#[derive(Accounts)]
#[instruction(name: String)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(
        init,
        payer = maker,
        space = Marketplace::MIN_SPACE + name.len(),
        seeds = [MARKETPLACE_SEED, name.as_bytes().as_ref()],
        bump,
    )]
    pub marketplace: Account<'info, Marketplace>,
    pub system_program: Program<'info, System>,
}

impl Initialize<'_> {
    pub fn handler(ctx: Context<Initialize>, name: String) -> Result<()> {
        ctx.accounts.marketplace.set_inner(Marketplace {
            bump: ctx.bumps.marketplace,
            maker: ctx.accounts.maker.key(),
            name,
        });

        Ok(())
    }
}
