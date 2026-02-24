/**
 * Simple USDC Transfer for Premium Pack Purchase (mainnet)
 *
 * Alternative to the Anchor program purchase — sends a direct SPL token
 * transfer of USDC to the treasury wallet. Works with any wallet on mainnet.
 */

import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
} from '@solana/spl-token';

/** USDC mint on mainnet-beta (6 decimals) */
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const USDC_DECIMALS = 6;

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
 * Build, send, and return the signature of a USDC transfer to the treasury.
 *
 * @param connection - Solana RPC connection
 * @param buyer - Buyer's public key
 * @param _packId - Pack UUID (unused here, kept for API symmetry)
 * @param sendTransaction - Wallet adapter's sendTransaction function
 * @returns Transaction signature
 */
export async function purchaseWithTransfer(
  connection: Connection,
  buyer: PublicKey,
  _packId: string,
  sendTransaction: (
    transaction: VersionedTransaction,
    connection: Connection
  ) => Promise<string>
): Promise<{ signature: string; blockhash: string; lastValidBlockHeight: number }> {
  const buyerAta = await getAssociatedTokenAddress(USDC_MINT, buyer);
  const treasuryAta = await getAssociatedTokenAddress(USDC_MINT, getTreasury());

  const ix = createTransferCheckedInstruction(
    buyerAta,       // source
    USDC_MINT,      // mint
    treasuryAta,    // destination
    buyer,          // owner / authority
    100_000, // 0.1 USDC — test price
    USDC_DECIMALS
  );

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
