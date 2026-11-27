// One-off test: call record_scan on the deployed RugRadar registry (devnet)
// and verify the ScanRecord PDA afterwards.
// Run AFTER funding + deploy:
//   NODE_PATH=~/workspace/dev3pack-token-scanner/node_modules node record-scan-test.mjs
// Requires: deploy wallet at ~/.config/solana/rugradar-devnet.json funded with devnet SOL,
// program deployed (anchor deploy --provider.cluster devnet).
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { getProgramDerivedAddress } from '@solana/addresses'; // v3: PDA derivation moved here
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('AdyPd6VJETKJTotVTYPPKBZKB3CeVaUpqiC3L9FKPNeR');
// POPCAT, score 88, verdict 2 (Aman) — the same values the web demo reports.
const MINT = new PublicKey('7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr');
const SCORE = 88;
const VERDICT = 2;
// record_scan discriminator from the generated IDL.
const DISCRIMINATOR = Buffer.from([84, 105, 74, 98, 184, 80, 165, 253]);

const secret = JSON.parse(
  readFileSync(`${homedir()}/.config/solana/rugradar-devnet.json`, 'utf8'),
);
const wallet = await Keypair.fromSecretKey(Uint8Array.from(secret)); // v3: fromSecretKey is async
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

const [pda] = await getProgramDerivedAddress({
  programAddress: PROGRAM_ID.toBase58(),
  seeds: [Buffer.from('scan'), MINT.toBytes(), wallet.publicKey.toBytes()],
});

const data = Buffer.concat([
  DISCRIMINATOR,
  MINT.toBytes(),
  Buffer.from([SCORE, VERDICT]),
]);

const ix = new TransactionInstruction({
  programId: PROGRAM_ID,
  keys: [
    { pubkey: pda, isSigner: false, isWritable: true },
    { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ],
  data,
});

const sig = await sendAndConfirmTransaction(
  connection,
  new Transaction().add(ix),
  [wallet],
);
console.log('record_scan tx:', sig);
console.log('explorer: https://explorer.solana.com/tx/' + sig + '?cluster=devnet');

const acc = await connection.getAccountInfo(new PublicKey(pda));
if (!acc) throw new Error('ScanRecord PDA not found after tx');
const d = Buffer.from(acc.data);
console.log('PDA:', pda.toBase58());
console.log('mint:', new PublicKey(d.subarray(8, 40)).toBase58());
console.log('score:', d[40], 'verdict:', d[41]);
console.log('scanner:', new PublicKey(d.subarray(42, 74)).toBase58());
console.log('timestamp:', Number(d.readBigInt64LE(74)));
