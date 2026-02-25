/**
 * Server-side PLAY Token Transfer Verification
 *
 * Verifies that a transaction signature corresponds to a valid PLAY token transfer
 * to the treasury wallet with the expected amount. Used when
 * NEXT_PUBLIC_PAYMENT_METHOD=transfer.
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

/** PLAY token mint on mainnet-beta */
const PLAY_MINT = new PublicKey('PLAYs3GSSadH2q2JLS7djp7yzeT75NK78XgrE5YLrfq');

/** Mainnet RPC — transfer mode always uses mainnet */
const MAINNET_RPC =
  process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com';

let _treasury: PublicKey | null = null;
function getTreasury(): PublicKey {
  if (!_treasury) {
    _treasury = new PublicKey(
      process.env.NEXT_PUBLIC_TREASURY_PUBKEY || '11111111111111111111111111111111'
    );
  }
  return _treasury;
}

/**
 * Poll for a parsed transaction with retries.
 */
async function fetchParsedTransaction(
  connection: Connection,
  signature: string,
  maxAttempts = 10,
  delayMs = 3000
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    });
    if (tx) return tx;
    if (i < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return null;
}

/**
 * Verify that a transaction signature is a valid PLAY token transfer to our treasury.
 *
 * Checks:
 * - Transaction succeeded (meta.err === null)
 * - Contains a SPL token transferChecked (or transfer) instruction
 * - Destination = treasury PLAY ATA
 * - Amount = expectedAmount
 * - Authority = buyerWallet
 * - Mint = PLAY (for transferChecked)
 *
 * Anti double-spend: relies on unique index on payment_signature in DB.
 *
 * @param signature - Transaction signature
 * @param buyerWallet - Base58 public key of the buyer
 * @param expectedAmount - Expected PLAY amount in raw units (6 decimals)
 * @returns true if the transfer is valid
 */
export async function verifyTransferPayment(
  signature: string,
  buyerWallet: string,
  expectedAmount: number
): Promise<boolean> {
  try {
    const connection = new Connection(MAINNET_RPC, 'confirmed');
    const treasuryAta = await getAssociatedTokenAddress(PLAY_MINT, getTreasury());
    const treasuryAtaStr = treasuryAta.toBase58();

    const tx = await fetchParsedTransaction(connection, signature);
    if (!tx) {
      console.error('Transfer verification: transaction not found after polling');
      return false;
    }

    // Transaction must have succeeded
    if (tx.meta?.err) {
      console.error('Transfer verification: transaction failed', tx.meta.err);
      return false;
    }

    // Walk through all inner + outer instructions looking for the SPL transfer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allInstructions: any[] = [
      ...(tx.transaction?.message?.instructions ?? []),
      ...(tx.meta?.innerInstructions?.flatMap(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (inner: any) => inner.instructions
      ) ?? []),
    ];

    for (const ix of allInstructions) {
      const parsed = ix.parsed;
      if (!parsed) continue;

      const ixType: string = parsed.type;
      const info = parsed.info;
      if (!info) continue;

      if (ixType === 'transferChecked') {
        // transferChecked includes mint and tokenAmount
        const matchesDest = info.destination === treasuryAtaStr;
        const matchesAuth = info.authority === buyerWallet;
        const matchesMint = info.mint === PLAY_MINT.toBase58();
        const rawAmount = Number(info.tokenAmount?.amount ?? '0');
        const matchesAmount = rawAmount === expectedAmount;

        if (matchesDest && matchesAuth && matchesMint && matchesAmount) {
          return true;
        }
      } else if (ixType === 'transfer') {
        // Plain transfer (no mint info) — check dest, authority, amount
        const matchesDest = info.destination === treasuryAtaStr;
        const matchesAuth = info.authority === buyerWallet;
        const rawAmount = Number(info.amount ?? '0');
        const matchesAmount = rawAmount === expectedAmount;

        if (matchesDest && matchesAuth && matchesAmount) {
          return true;
        }
      }
    }

    console.error('Transfer verification: no matching SPL transfer instruction found');
    return false;
  } catch (error) {
    console.error('Error verifying transfer payment:', error);
    return false;
  }
}
