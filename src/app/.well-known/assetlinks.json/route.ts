import { NextResponse } from 'next/server';

const assetLinks = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.polydraft.psg1',
      sha256_cert_fingerprints: [
        '86:11:61:5B:5A:1A:AC:33:21:C2:E1:A1:36:C2:7A:01:CC:7D:F6:36:1D:F1:4B:04:84:B3:B2:54:F1:EC:10:B4', // replace with real keystore SHA-256 fingerprint
      ],
    },
  },
];

export async function GET() {
  return NextResponse.json(assetLinks, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
