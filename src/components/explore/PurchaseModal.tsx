'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { ExploreMarket, ExploreOutcome } from '@/lib/jupiter/types';
import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  createPredictionOrder,
  microToUsd,
} from '@/lib/jupiter/prediction-api';
import { getSolscanUrl } from '@/lib/jupiter/transaction';

interface PurchaseModalProps {
  isOpen: boolean;
  outcome: ExploreOutcome;
  market: ExploreMarket;
  direction: 'yes' | 'no';
  onConfirm: (amount: number) => void;
  onCancel: () => void;
}

const PRESET_AMOUNTS = [2, 5, 10, 25];

type PurchaseState =
  | 'select_amount'    // Initial: choose amount
  | 'creating_order'   // Calling Jupiter API
  | 'signing'          // Waiting for wallet signature
  | 'confirming'       // Confirming on blockchain
  | 'success'          // Completed
  | 'error';           // Error occurred

interface PurchaseResult {
  signature?: string;
  contracts?: string;
  totalCost?: number;
  fee?: number;
  error?: string;
}

function formatProbability(prob: number): string {
  return `${Math.round(prob * 100)}%`;
}

function getCategoryEmoji(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('sport') || lower.includes('nba') || lower.includes('nfl')) return '🏀';
  if (lower.includes('politic') || lower.includes('election')) return '🗳️';
  if (lower.includes('crypto') || lower.includes('bitcoin')) return '₿';
  if (lower.includes('econ') || lower.includes('finance')) return '📈';
  if (lower.includes('entertain') || lower.includes('oscar')) return '🎬';
  if (lower.includes('tech')) return '💻';
  if (lower.includes('business') || lower.includes('m&a')) return '🏢';
  return '🎯';
}

function getOutcomeImageUrl(outcome: ExploreOutcome, market: ExploreMarket): string | null {
  if (outcome.image_slug && market.event_ticker) {
    return `/images/explore/outcomes/${market.event_ticker}-${outcome.image_slug}`;
  }
  if (outcome.image_url) return outcome.image_url;
  if (market.image_url) return market.image_url;
  return null;
}

function getStateMessage(state: PurchaseState): string {
  switch (state) {
    case 'creating_order':
      return 'Creating order...';
    case 'signing':
      return 'Please sign in your wallet...';
    case 'confirming':
      return 'Confirming transaction...';
    case 'success':
      return 'Purchase successful!';
    case 'error':
      return 'Transaction failed';
    default:
      return '';
  }
}

export function PurchaseModal({
  isOpen,
  outcome,
  market,
  direction,
  onConfirm,
  onCancel,
}: PurchaseModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [imageError, setImageError] = useState(false);
  const [purchaseState, setPurchaseState] = useState<PurchaseState>('select_amount');
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult>({});

  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();

  const isYes = direction === 'yes';
  const imageUrl = getOutcomeImageUrl(outcome, market);

  // Get the Jupiter market ID - must be explicitly set on the outcome
  const jupiterMarketId = outcome.jupiterMarketId;
  const hasJupiterMarket = !!jupiterMarketId;

  const resetState = useCallback(() => {
    setPurchaseState('select_amount');
    setPurchaseResult({});
    setSelectedAmount(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!selectedAmount || !publicKey || !sendTransaction || !connected) {
      return;
    }

    if (!jupiterMarketId) {
      setPurchaseState('error');
      setPurchaseResult({
        error: 'This market is not available for trading on Jupiter yet.',
      });
      return;
    }

    try {
      // Step 1: Create order
      setPurchaseState('creating_order');

      const price = isYes ? outcome.probability : 1 - outcome.probability;

      const orderResponse = await createPredictionOrder(
        publicKey.toBase58(),
        jupiterMarketId,
        isYes,
        price,
        selectedAmount
      );

      // Step 2: Send transaction (wallet will sign and send via its own RPC)
      setPurchaseState('signing');

      const txBuffer = Buffer.from(orderResponse.transaction, 'base64');
      const tx = VersionedTransaction.deserialize(txBuffer);
      const signature = await sendTransaction(tx, connection);

      // Step 3: Confirm on chain
      setPurchaseState('confirming');

      await connection.confirmTransaction(
        {
          signature,
          blockhash: orderResponse.txMeta.blockhash,
          lastValidBlockHeight: orderResponse.txMeta.lastValidBlockHeight,
        },
        'confirmed'
      );

      // Success!
      setPurchaseState('success');
      setPurchaseResult({
        signature,
        contracts: orderResponse.order.contracts,
        totalCost: microToUsd(orderResponse.order.orderCostUsd),
        fee: microToUsd(orderResponse.order.estimatedTotalFeeUsd),
      });

      // Notify parent
      onConfirm(selectedAmount);
    } catch (error) {
      console.error('Purchase error:', error);
      setPurchaseState('error');
      setPurchaseResult({
        error: error instanceof Error ? error.message : 'Transaction failed',
      });
    }
  }, [
    selectedAmount,
    publicKey,
    sendTransaction,
    connected,
    connection,
    isYes,
    outcome.probability,
    jupiterMarketId,
    onConfirm,
  ]);

  const handleCancel = useCallback(() => {
    resetState();
    onCancel();
  }, [resetState, onCancel]);

  const handleRetry = useCallback(() => {
    setPurchaseState('select_amount');
    setPurchaseResult({});
  }, []);

  const isProcessing = ['creating_order', 'signing', 'confirming'].includes(purchaseState);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isProcessing ? undefined : handleCancel}
            className="fixed inset-0 bg-black/70 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-4 top-4 z-50 max-w-sm mx-auto"
          >
            <div className="bg-card-bg border-balatro-thick border-purple-500/40 rounded-balatro-card shadow-hard-lg overflow-hidden">
              {/* Inner border */}
              <div className="balatro-card-inner border-purple-400/20" />

              {/* Header with direction */}
              <div
                className={`px-3 py-2 ${
                  isYes ? 'bg-green-500/20' : 'bg-red-500/20'
                } border-b border-white/10`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`font-bold text-lg font-pixel-heading ${
                      isYes ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {isYes ? 'BUY YES' : 'BUY NO'}
                  </div>
                  {!isProcessing && (
                    <button
                      onClick={handleCancel}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <span className="text-gray-400">✕</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-3">
                {/* Outcome info (always shown) */}
                <div className="relative w-full h-24 rounded-lg overflow-hidden mb-3 border-2 border-white/10">
                  {imageUrl && !imageError ? (
                    <Image
                      src={imageUrl}
                      alt={outcome.label}
                      fill
                      className="object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600/30 to-indigo-600/30 flex items-center justify-center">
                      <span className="text-5xl">{getCategoryEmoji(market.category)}</span>
                    </div>
                  )}
                </div>

                <h3 className="text-base font-bold text-center mb-1 font-pixel-body">
                  {outcome.label}
                </h3>
                <p className="text-xl font-bold text-purple-400 font-pixel-heading text-center mb-3">
                  {formatProbability(outcome.probability)}
                </p>

                {/* Wallet not connected */}
                {!connected && purchaseState === 'select_amount' && (
                  <div className="mb-3 text-center">
                    <p className="text-sm text-gray-400 mb-3">Connect your wallet to purchase</p>
                    <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
                  </div>
                )}

                {/* Market not available warning */}
                {connected && purchaseState === 'select_amount' && !hasJupiterMarket && (
                  <div className="mb-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-yellow-400 text-sm text-center">
                      This market is not available for trading on Jupiter yet.
                    </p>
                  </div>
                )}

                {/* Amount selection (only when connected and in select_amount state) */}
                {connected && purchaseState === 'select_amount' && hasJupiterMarket && (
                  <>
                    <div className="mb-3">
                      <p className="text-sm text-gray-400 text-center mb-2">Select amount (USDC)</p>
                      <div className="grid grid-cols-4 gap-2">
                        {PRESET_AMOUNTS.map((amount) => (
                          <button
                            key={amount}
                            onClick={() => setSelectedAmount(amount)}
                            className={`py-2.5 rounded-lg font-bold text-base transition-all ${
                              selectedAmount === amount
                                ? isYes
                                  ? 'bg-green-500 text-white scale-105'
                                  : 'bg-red-500 text-white scale-105'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            ${amount}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Potential return */}
                    {selectedAmount && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-3 p-2 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Potential return</span>
                          <span className={`font-bold ${isYes ? 'text-green-400' : 'text-red-400'}`}>
                            ${(selectedAmount / (isYes ? outcome.probability : 1 - outcome.probability)).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Est. fee (~2.3%)</span>
                          <span className="text-gray-500">
                            ~${(selectedAmount * 0.023).toFixed(2)}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        className="flex-1 py-2.5 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirm}
                        disabled={!selectedAmount}
                        className={`flex-1 py-2.5 rounded-lg font-bold transition-all ${
                          selectedAmount
                            ? isYes
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Confirm ${selectedAmount || ''}
                      </button>
                    </div>
                  </>
                )}

                {/* Processing state */}
                {isProcessing && (
                  <div className="py-4 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-white font-medium">{getStateMessage(purchaseState)}</p>
                    {purchaseState === 'signing' && (
                      <p className="text-sm text-gray-400 mt-2">
                        Check your wallet for the signature request
                      </p>
                    )}
                  </div>
                )}

                {/* Success state */}
                {purchaseState === 'success' && purchaseResult.signature && (
                  <div className="py-4 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-green-500/20 rounded-full flex items-center justify-center">
                      <span className="text-4xl">✓</span>
                    </div>
                    <p className="text-green-400 font-bold text-lg mb-2">Purchase Successful!</p>

                    <div className="bg-white/5 rounded-lg p-3 mb-3 text-left">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Contracts</span>
                        <span className="text-white font-medium">{purchaseResult.contracts}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Total Cost</span>
                        <span className="text-white font-medium">
                          ${purchaseResult.totalCost?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Fee</span>
                        <span className="text-gray-400">
                          ${purchaseResult.fee?.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <a
                      href={getSolscanUrl(purchaseResult.signature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-purple-400 hover:text-purple-300 text-sm underline mb-3"
                    >
                      View on Solscan ↗
                    </a>

                    <button
                      onClick={handleCancel}
                      className="w-full py-2.5 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                )}

                {/* Error state */}
                {purchaseState === 'error' && (
                  <div className="py-4 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-red-500/20 rounded-full flex items-center justify-center">
                      <span className="text-4xl">✕</span>
                    </div>
                    <p className="text-red-400 font-bold text-lg mb-2">Transaction Failed</p>
                    <p className="text-sm text-gray-400 mb-4">
                      {purchaseResult.error || 'Something went wrong'}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        className="flex-1 py-2.5 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRetry}
                        className="flex-1 py-2.5 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
