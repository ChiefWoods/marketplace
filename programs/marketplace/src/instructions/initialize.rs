use crate::{constants::*, state::*};
use anchor_lang::{prelude::*, Discriminator};

#[derive(Accounts)]
#[instruction(name: String)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(
        init,
        payer = maker,
        space = Marketplace::DISCRIMINATOR.len() + Marketplace::init_space(&name),
        seeds = [MARKETPLACE_SEED, name.as_bytes().as_ref()],
        bump,
    )]
    pub marketplace: Account<'info, Marketplace>,
    pub system_program: Program<'info, System>,
}

impl Initialize<'_> {
    pub fn initialize(ctx: Context<Initialize>, name: String) -> Result<()> {
        ctx.accounts.marketplace.set_inner(Marketplace {
            bump: ctx.bumps.marketplace,
            maker: ctx.accounts.maker.key(),
            name,
        });

        Ok(())
    }
}
