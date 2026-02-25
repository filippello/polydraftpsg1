/**
 * Simple PLAY Token Transfer for Premium Pack Purchase (mainnet)
 *
 * Alternative to the Anchor program purchase — sends a direct SPL token
 * transfer of PLAY to the treasury wallet. Works with any wallet on mainnet.
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
  createAssociatedTokenAccountIdempotentInstruction,
} from '@solana/spl-token';

/** PLAY token mint on mainnet-beta (6 decimals) */
const PLAY_MINT = new PublicKey('PLAYs3GSSadH2q2JLS7djp7yzeT75NK78XgrE5YLrfq');
const PLAY_DECIMALS = 6;

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
 * Build, send, and return the signature of a PLAY token transfer to the treasury.
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
  const buyerAta = await getAssociatedTokenAddress(PLAY_MINT, buyer);
  const treasuryAta = await getAssociatedTokenAddress(PLAY_MINT, getTreasury());

  const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
    buyer,          // payer
    treasuryAta,    // associatedToken
    getTreasury(),  // owner
    PLAY_MINT       // mint
  );

  const ix = createTransferCheckedInstruction(
    buyerAta,       // source
    PLAY_MINT,      // mint
    treasuryAta,    // destination
    buyer,          // owner / authority
    100_000_000,    // 100 PLAY (6 decimals)
    PLAY_DECIMALS
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  const message = new TransactionMessage({
    payerKey: buyer,
    recentBlockhash: blockhash,
    instructions: [createAtaIx, ix],
  }).compileToV0Message();

  const tx = new VersionedTransaction(message);
  const signature = await sendTransaction(tx, connection);

  return { signature, blockhash, lastValidBlockHeight };
}
