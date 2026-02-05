/**
 * Jupiter Prediction Market Transaction Executor
 *
 * Handles signing and sending transactions returned by the Jupiter Prediction API.
 */

import { Connection, VersionedTransaction } from '@solana/web3.js';
import type { CreateOrderResponse } from './prediction-api';

export interface TransactionResult {
  signature: string;
  success: boolean;
  error?: string;
}

/**
 * Execute a Jupiter order by signing and sending the transaction
 *
 * @param connection Solana connection
 * @param signTransaction Wallet's signTransaction function
 * @param orderResponse Response from createOrder API
 * @returns Transaction signature
 */
export async function executeJupiterOrder(
  connection: Connection,
  signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>,
  orderResponse: CreateOrderResponse
): Promise<string> {
  // 1. Deserialize the base64-encoded transaction
  const txBuffer = Buffer.from(orderResponse.transaction, 'base64');
  const tx = VersionedTransaction.deserialize(txBuffer);

  // 2. Sign the transaction with the user's wallet
  const signedTx = await signTransaction(tx);

  // 3. Send the raw transaction to the network
  const signature = await connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
    preflightCommitment: 'confirmed',
  });

  // 4. Confirm the transaction using the blockhash from the API response
  const confirmation = await connection.confirmTransaction(
    {
      signature,
      blockhash: orderResponse.txMeta.blockhash,
      lastValidBlockHeight: orderResponse.txMeta.lastValidBlockHeight,
    },
    'confirmed'
  );

  if (confirmation.value.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
  }

  return signature;
}

/**
 * Execute a Jupiter order with error handling
 *
 * @param connection Solana connection
 * @param signTransaction Wallet's signTransaction function
 * @param orderResponse Response from createOrder API
 * @returns Transaction result with signature or error
 */
export async function executeJupiterOrderSafe(
  connection: Connection,
  signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>,
  orderResponse: CreateOrderResponse
): Promise<TransactionResult> {
  try {
    const signature = await executeJupiterOrder(
      connection,
      signTransaction,
      orderResponse
    );
    return { signature, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { signature: '', success: false, error: message };
  }
}

/**
 * Get the Solscan URL for a transaction
 *
 * @param signature Transaction signature
 * @param cluster 'mainnet-beta' | 'devnet' | 'testnet'
 * @returns Solscan URL
 */
export function getSolscanUrl(
  signature: string,
  cluster: 'mainnet-beta' | 'devnet' | 'testnet' = 'mainnet-beta'
): string {
  const baseUrl = 'https://solscan.io/tx';
  const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
  return `${baseUrl}/${signature}${clusterParam}`;
}

/**
 * Get the Solana Explorer URL for a transaction
 *
 * @param signature Transaction signature
 * @param cluster 'mainnet-beta' | 'devnet' | 'testnet'
 * @returns Explorer URL
 */
export function getExplorerUrl(
  signature: string,
  cluster: 'mainnet-beta' | 'devnet' | 'testnet' = 'mainnet-beta'
): string {
  const baseUrl = 'https://explorer.solana.com/tx';
  const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
  return `${baseUrl}/${signature}${clusterParam}`;
}
