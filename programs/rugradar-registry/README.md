# RugRadar Scan Registry

On-chain component of **RugRadar** — a Token Safety Scanner for Solana memecoins
(Dev3pack Global Hackathon, 27–29 Nov 2026).

## What it is

The RugRadar web app (https://dadapy04.github.io/rugradar/) is a read-only scanner:
paste a token mint, get a 0–100 Safety Score plus an Aman / Waspada /
Berisiko Tinggi verdict. It needs no wallet and no on-chain program to scan.

This Anchor program is the **on-chain record** of those scan results. Anyone can
call `record_scan` to store a scan outcome — token mint, score (0–100) and
verdict — in a PDA, so results are public, timestamped and attributable to the
wallet that recorded them.

## Program

- **Network:** Solana Devnet
- **Program ID:** `AdyPd6VJETKJTotVTYPPKBZKB3CeVaUpqiC3L9FKPNeR`
- **Explorer:** https://explorer.solana.com/address/AdyPd6VJETKJTotVTYPPKBZKB3CeVaUpqiC3L9FKPNeR?cluster=devnet

## Instruction

### `record_scan(mint: Pubkey, score: u8, verdict: u8)`

Creates a `ScanRecord` PDA with seeds `["scan", mint, scanner]`:

| Field | Type | Description |
|---|---|---|
| `mint` | Pubkey | Token mint that was scanned |
| `score` | u8 | Safety score, 0–100 |
| `verdict` | u8 | 0 = high risk (<50), 1 = caution (50–79), 2 = low risk (80–100) |
| `scanner` | Pubkey | Wallet that recorded the scan (signer) |
| `timestamp` | i64 | Unix timestamp of the scan |

## Build & deploy

```bash
anchor build
anchor deploy --provider.cluster devnet
```

Deployment wallet: `~/.config/solana/rugradar-devnet.json` (devnet only).
