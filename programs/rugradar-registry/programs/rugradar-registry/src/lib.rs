//! RugRadar Scan Registry — on-chain component of RugRadar.
//!
//! RugRadar itself is a read-only web scanner (no wallet needed): it reads
//! Solana token accounts, DexScreener and Jupiter data and computes a 0–100
//! safety score for any Solana memecoin. This program is the on-chain record
//! of those scan results: anyone can store the outcome of a scan
//! (token mint + score + verdict) in a PDA, so results are public,
//! timestamped and attributable to the wallet that recorded them.
//!
//! Verdict mapping (matches the web scanner):
//!   0 = high risk    ("Berisiko Tinggi", score < 50)
//!   1 = caution      ("Waspada",          score 50–79)
//!   2 = low risk     ("Aman",             score 80–100)
//!
//! PDA seeds: ["scan", mint, scanner]

use anchor_lang::prelude::*;

declare_id!("AdyPd6VJETKJTotVTYPPKBZKB3CeVaUpqiC3L9FKPNeR");

#[program]
pub mod rugradar_registry {
    use super::*;

    /// Record the result of a RugRadar scan on-chain.
    /// Creates one `ScanRecord` PDA per (mint, scanner) pair.
    pub fn record_scan(
        ctx: Context<RecordScan>,
        mint: Pubkey,
        score: u8,
        verdict: u8,
    ) -> Result<()> {
        require!(score <= 100, RegistryError::ScoreOutOfRange);
        require!(verdict <= 2, RegistryError::VerdictOutOfRange);

        let record = &mut ctx.accounts.scan_record;
        record.mint = mint;
        record.score = score;
        record.verdict = verdict;
        record.scanner = ctx.accounts.scanner.key();
        record.timestamp = Clock::get()?.unix_timestamp;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(mint: Pubkey, score: u8, verdict: u8)]
pub struct RecordScan<'info> {
    #[account(
        init,
        payer = scanner,
        space = 8 + ScanRecord::INIT_SPACE,
        seeds = [b"scan", mint.as_ref(), scanner.key().as_ref()],
        bump,
    )]
    pub scan_record: Account<'info, ScanRecord>,

    #[account(mut)]
    pub scanner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// One recorded scan result. Size: 8 (discriminator) + 32 + 1 + 1 + 32 + 8 = 82 bytes.
#[account]
#[derive(InitSpace)]
pub struct ScanRecord {
    /// Token mint that was scanned.
    pub mint: Pubkey,
    /// Safety score, 0–100.
    pub score: u8,
    /// 0 = high risk (<50), 1 = caution (50–79), 2 = low risk (80–100).
    pub verdict: u8,
    /// Wallet that recorded the scan.
    pub scanner: Pubkey,
    /// Unix timestamp of the scan.
    pub timestamp: i64,
}

#[error_code]
pub enum RegistryError {
    #[msg("Score must be between 0 and 100")]
    ScoreOutOfRange,
    #[msg("Verdict must be 0 (high risk), 1 (caution) or 2 (low risk)")]
    VerdictOutOfRange,
}
