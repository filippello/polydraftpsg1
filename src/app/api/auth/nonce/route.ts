import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';

// Validate Solana address: base58, 32-44 characters
const ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');

  if (!address || !ADDRESS_RE.test(address)) {
    return NextResponse.json(
      { error: 'Invalid wallet address' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Invalidate old unused nonces for this address
  await supabase
    .from('auth_nonces')
    .update({ used: true })
    .eq('wallet_address', address)
    .eq('used', false);

  // Generate new nonce
  const nonce = crypto.randomBytes(32).toString('hex');

  const { error } = await supabase.from('auth_nonces').insert({
    wallet_address: address,
    nonce,
  });

  if (error) {
    console.error('Failed to create nonce:', error);
    return NextResponse.json(
      { error: 'Failed to create nonce' },
      { status: 500 }
    );
  }

  return NextResponse.json({ nonce });
}
