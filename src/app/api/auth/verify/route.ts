import { NextRequest, NextResponse } from 'next/server';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';

const JWT_SECRET = process.env.JWT_SECRET;

function createJWT(payload: Record<string, unknown>): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

export async function POST(request: NextRequest) {
  if (!JWT_SECRET) {
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 500 }
    );
  }

  let body: { address?: string; signature?: string; nonce?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { address, signature, nonce } = body;

  if (!address || !signature || !nonce) {
    return NextResponse.json(
      { error: 'Missing address, signature, or nonce' },
      { status: 400 }
    );
  }

  // 1. Look up nonce in DB
  const supabase = createServiceClient();

  const { data: nonceRow, error: nonceError } = await supabase
    .from('auth_nonces')
    .select('*')
    .eq('wallet_address', address)
    .eq('nonce', nonce)
    .eq('used', false)
    .single();

  if (nonceError || !nonceRow) {
    return NextResponse.json(
      { error: 'Invalid or expired nonce' },
      { status: 401 }
    );
  }

  // Check expiry
  if (new Date(nonceRow.expires_at) < new Date()) {
    await supabase
      .from('auth_nonces')
      .update({ used: true })
      .eq('id', nonceRow.id);

    return NextResponse.json(
      { error: 'Nonce expired' },
      { status: 401 }
    );
  }

  // 2. Verify Ed25519 signature
  const message = `Sign this message to authenticate with Polydraft.\n\nNonce: ${nonce}`;
  const messageBytes = new TextEncoder().encode(message);

  let publicKeyBytes: Uint8Array;
  try {
    publicKeyBytes = bs58.decode(address);
  } catch {
    return NextResponse.json(
      { error: 'Invalid address encoding' },
      { status: 400 }
    );
  }

  let signatureBytes: Uint8Array;
  try {
    signatureBytes = bs58.decode(signature);
  } catch {
    return NextResponse.json(
      { error: 'Invalid signature encoding' },
      { status: 400 }
    );
  }

  const isValid = nacl.sign.detached.verify(
    messageBytes,
    signatureBytes,
    publicKeyBytes
  );

  if (!isValid) {
    return NextResponse.json(
      { error: 'Signature verification failed' },
      { status: 401 }
    );
  }

  // 3. Mark nonce as used
  await supabase
    .from('auth_nonces')
    .update({ used: true })
    .eq('id', nonceRow.id);

  // 4. Get or create profile
  const { data: profileId, error: profileError } = await supabase
    .rpc('get_or_create_wallet_profile', { p_wallet_address: address });

  if (profileError || !profileId) {
    console.error('Failed to get/create profile:', profileError);
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }

  // 5. Mint JWT
  const now = Math.floor(Date.now() / 1000);
  const token = createJWT({
    sub: profileId,
    address,
    iat: now,
    exp: now + 7 * 24 * 60 * 60, // 7 days
  });

  return NextResponse.json({
    token,
    profileId,
    address,
  });
}
