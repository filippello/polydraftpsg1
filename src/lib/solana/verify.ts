/**
 * Server-side Solana Purchase Receipt Verification
 *
 * Verifies that a purchase receipt PDA exists on-chain,
 * belongs to our program, and contains the expected data.
 */

import { Connection, PublicKey } from '@solana/web3.js';

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

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

/** Anchor account discriminator for PurchaseReceipt (first 8 bytes of sha256("account:PurchaseReceipt")) */
const RECEIPT_DISCRIMINATOR = Buffer.from([
  79, 127, 115, 104, 109, 54, 216, 32,
]);

// ============================================
// Deserialization
// ============================================

interface PurchaseReceiptData {
  buyer: PublicKey;
  amount: bigint;
  clientSeed: string;
  timestamp: bigint;
  bump: number;
}

function deserializeReceipt(data: Buffer): PurchaseReceiptData | null {
  if (data.length < 8) return null;

  // Check discriminator
  const disc = data.subarray(0, 8);
  if (!disc.equals(RECEIPT_DISCRIMINATOR)) return null;

  let offset = 8;

  // buyer: Pubkey (32 bytes)
  const buyer = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;

  // amount: u64 (8 bytes LE)
  const amount = data.readBigUInt64LE(offset);
  offset += 8;

  // client_seed: String (4 byte len + bytes)
  const seedLen = data.readUInt32LE(offset);
  offset += 4;
  const clientSeed = data.subarray(offset, offset + seedLen).toString('utf-8');
  offset += seedLen;

  // timestamp: i64 (8 bytes LE)
  const timestamp = data.readBigInt64LE(offset);
  offset += 8;

  // bump: u8 (1 byte)
  const bump = data.readUInt8(offset);

  return { buyer, amount, clientSeed, timestamp, bump };
}

// ============================================
// PDA Derivation (server-side)
// ============================================

/** Strip hyphens from UUID to fit Solana's 32-byte seed limit */
function sanitizeSeed(uuid: string): string {
  return uuid.replace(/-/g, '');
}

function derivePurchaseReceiptPDA(
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
// Verification
// ============================================

/**
 * Verify that a purchase receipt exists on-chain and matches expected values.
 *
 * @param buyerWallet - Base58 public key of the buyer
 * @param packId - Pack UUID used as client_seed
 * @param expectedAmount - Expected USDC amount in raw units (6 decimals)
 * @returns true if receipt is valid
 */
export async function verifyPurchaseReceipt(
  buyerWallet: string,
  packId: string,
  expectedAmount: number
): Promise<boolean> {
  try {
    const connection = new Connection(RPC_URL, 'confirmed');
    const buyer = new PublicKey(buyerWallet);
    const [receiptPda] = derivePurchaseReceiptPDA(buyer, packId);

    const accountInfo = await connection.getAccountInfo(receiptPda);

    if (!accountInfo) {
      console.error('Purchase receipt PDA not found on-chain');
      return false;
    }

    // Check the account is owned by our program
    if (!accountInfo.owner.equals(getProgramId())) {
      console.error('Receipt account not owned by our program');
      return false;
    }

    // Deserialize and validate
    const receipt = deserializeReceipt(Buffer.from(accountInfo.data));
    if (!receipt) {
      console.error('Failed to deserialize receipt');
      return false;
    }

    // Check buyer matches
    if (!receipt.buyer.equals(buyer)) {
      console.error('Receipt buyer mismatch');
      return false;
    }

    // Check amount matches
    if (receipt.amount !== BigInt(expectedAmount)) {
      console.error('Receipt amount mismatch:', receipt.amount, '!==', expectedAmount);
      return false;
    }

    // Check client_seed matches pack ID (stored without hyphens)
    if (receipt.clientSeed !== sanitizeSeed(packId)) {
      console.error('Receipt client_seed mismatch');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying purchase receipt:', error);
    return false;
  }
}
