use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("2kFruWkndEjnMJkFR5dkKbLjuCpoZ2nx3rHx9KFutKx1");

/// USDC mint on mainnet-beta
pub const USDC_MINT: Pubkey = pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

/// Treasury wallet that receives USDC payments
pub const TREASURY: Pubkey = pubkey!("FJASGessZXm5n3DWvcNEMxkbwi7wvx8XjezY5xoXsAMD");

#[program]
pub mod polydraft_purchase {
    use super::*;

    pub fn buy_pack(ctx: Context<BuyPack>, client_seed: String, amount: u64) -> Result<()> {
        require!(client_seed.len() <= 32, PurchaseError::SeedTooLong);
        require!(amount > 0, PurchaseError::ZeroAmount);

        // CPI: transfer USDC from buyer ATA → treasury ATA
        let cpi_accounts = Transfer {
            from: ctx.accounts.buyer_usdc.to_account_info(),
            to: ctx.accounts.treasury_usdc.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Write receipt
        let receipt = &mut ctx.accounts.receipt;
        receipt.buyer = ctx.accounts.buyer.key();
        receipt.amount = amount;
        receipt.client_seed = client_seed;
        receipt.timestamp = Clock::get()?.unix_timestamp;
        receipt.bump = ctx.bumps.receipt;

        Ok(())
    }
}

// ============================================
// Accounts
// ============================================

#[derive(Accounts)]
#[instruction(client_seed: String, amount: u64)]
pub struct BuyPack<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// Buyer's USDC associated token account
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = buyer,
    )]
    pub buyer_usdc: Account<'info, TokenAccount>,

    /// Treasury USDC associated token account
    #[account(
        mut,
        token::mint = usdc_mint,
        constraint = treasury_usdc.owner == TREASURY @ PurchaseError::InvalidTreasury,
    )]
    pub treasury_usdc: Account<'info, TokenAccount>,

    /// USDC mint (validated against known address)
    #[account(
        constraint = usdc_mint.key() == USDC_MINT @ PurchaseError::InvalidMint,
    )]
    /// CHECK: Validated by constraint above
    pub usdc_mint: UncheckedAccount<'info>,

    /// PDA receipt — unique per (buyer, client_seed)
    #[account(
        init,
        payer = buyer,
        space = 8 + PurchaseReceipt::INIT_SPACE,
        seeds = [b"purchase", buyer.key().as_ref(), client_seed.as_bytes()],
        bump,
    )]
    pub receipt: Account<'info, PurchaseReceipt>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// ============================================
// State
// ============================================

#[account]
#[derive(InitSpace)]
pub struct PurchaseReceipt {
    pub buyer: Pubkey,     // 32
    pub amount: u64,       // 8
    #[max_len(32)]
    pub client_seed: String, // 4 + 32
    pub timestamp: i64,    // 8
    pub bump: u8,          // 1
}

// ============================================
// Errors
// ============================================

#[error_code]
pub enum PurchaseError {
    #[msg("client_seed must be <= 32 bytes")]
    SeedTooLong,
    #[msg("amount must be > 0")]
    ZeroAmount,
    #[msg("Invalid USDC mint")]
    InvalidMint,
    #[msg("Invalid treasury account")]
    InvalidTreasury,
}
