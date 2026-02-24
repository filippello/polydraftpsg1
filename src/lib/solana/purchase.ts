/**
 * Solana Purchase Transaction Builder
 *
 * Builds and sends the buy_pack instruction for premium pack purchases.
 * No @coral-xyz/anchor dependency — builds instruction manually from IDL.
 */

import {
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  SystemProgram,
} from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';

// ============================================
// Constants (lazy to avoid errors during server-side module evaluation)
// ============================================

let _programId: PublicKey | null = null;
function getProgramId(): PublicKey {
  if (!_programId) {
    _programId = new PublicKey(
      process.env.NEXT_PUBLIC_PURCHASE_PROGRAM_ID || '11111111111111111111111111111111'
    );
  }
  return _programId;
}

let _treasury: PublicKey | null = null;
function getTreasury(): PublicKey {
  if (!_treasury) {
    _treasury = new PublicKey(
      process.env.NEXT_PUBLIC_TREASURY_PUBKEY || '11111111111111111111111111111111'
    );
  }
  return _treasury;
}

/** USDC mint on mainnet-beta (6 decimals) */
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

/** Fixed premium pack price: $1 USDC = 1_000_000 (6 decimal places) */
export const PREMIUM_PACK_PRICE = 1_000_000;

/** Anchor discriminator for buy_pack instruction (first 8 bytes of sha256("global:buy_pack")) */
const BUY_PACK_DISCRIMINATOR = Buffer.from([
  139, 119, 84, 201, 243, 31, 236, 11,
]);

// ============================================
// PDA Derivation
// ============================================

/** Strip hyphens from UUID to fit Solana's 32-byte seed limit */
function sanitizeSeed(uuid: string): string {
  return uuid.replace(/-/g, '');
}

/**
 * Derive the PDA for a purchase receipt.
 * Seeds: ["purchase", buyer_pubkey, client_seed_bytes]
 */
export function derivePurchaseReceiptPDA(
  buyer: PublicKey,
  clientSeed: string
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('purchase'),
      buyer.toBuffer(),
      Buffer.from(sanitizeSeed(clientSeed)),
    ],
    getProgramId()
  );
}

// ============================================
// Instruction Builder
// ============================================

function encodeBuyPackArgs(clientSeed: string, amount: bigint): Buffer {
  // Borsh encoding: discriminator(8) + string(4 len + bytes) + u64(8)
  const seedBytes = Buffer.from(clientSeed);
  const buf = Buffer.alloc(8 + 4 + seedBytes.length + 8);
  let offset = 0;

  // Discriminator
  BUY_PACK_DISCRIMINATOR.copy(buf, offset);
  offset += 8;

  // String: 4-byte LE length prefix + UTF-8 bytes
  buf.writeUInt32LE(seedBytes.length, offset);
  offset += 4;
  seedBytes.copy(buf, offset);
  offset += seedBytes.length;

  // u64: 8-byte LE
  buf.writeBigUInt64LE(amount, offset);

  return buf;
}

async function buildBuyPackInstruction(
  buyer: PublicKey,
  clientSeed: string,
  amount: bigint
): Promise<TransactionInstruction> {
  const buyerUsdc = await getAssociatedTokenAddress(USDC_MINT, buyer);
  const treasuryUsdc = await getAssociatedTokenAddress(USDC_MINT, getTreasury());
  const [receiptPda] = derivePurchaseReceiptPDA(buyer, clientSeed);

  const data = encodeBuyPackArgs(clientSeed, amount);

  const keys = [
    { pubkey: buyer, isSigner: true, isWritable: true },
    { pubkey: buyerUsdc, isSigner: false, isWritable: true },
    { pubkey: treasuryUsdc, isSigner: false, isWritable: true },
    { pubkey: USDC_MINT, isSigner: false, isWritable: false },
    { pubkey: receiptPda, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    programId: getProgramId(),
    keys,
    data,
  });
}

// ============================================
// Public API
// ============================================

/**
 * Build, send, and confirm a premium pack purchase transaction.
 *
 * @param connection - Solana RPC connection
 * @param buyer - Buyer's public key
 * @param clientSeed - Pack UUID used as client_seed (idempotency key)
 * @param sendTransaction - Wallet adapter's sendTransaction function
 * @returns Transaction signature
 */
export async function purchasePremiumPack(
  connection: Connection,
  buyer: PublicKey,
  clientSeed: string,
  sendTransaction: (
    transaction: VersionedTransaction,
    connection: Connection
  ) => Promise<string>
): Promise<{ signature: string; blockhash: string; lastValidBlockHeight: number }> {
  const amount = BigInt(PREMIUM_PACK_PRICE);

  const sanitized = clientSeed.replace(/-/g, '');
  const ix = await buildBuyPackInstruction(buyer, sanitized, amount);

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  const message = new TransactionMessage({
    payerKey: buyer,
    recentBlockhash: blockhash,
    instructions: [ix],
  }).compileToV0Message();

  const tx = new VersionedTransaction(message);

  const signature = await sendTransaction(tx, connection);

  return { signature, blockhash, lastValidBlockHeight };
}
