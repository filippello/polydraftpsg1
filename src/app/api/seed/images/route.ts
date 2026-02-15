/**
 * Seed API Route - Upload Event Images
 *
 * POST /api/seed/images
 * Uploads event images to Supabase Storage and updates event records
 *
 * Body: { venue?: "polymarket" | "jupiter", period: "week7" }
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

const BUCKET_NAME = 'event-images';

interface ImageSeedRequest {
  venue?: string;
  period: string;
}

export async function POST(request: Request) {
  let venue = 'polymarket';
  let imagesDir: string;

  try {
    const body: ImageSeedRequest = await request.json();

    if (!body.period) {
      return NextResponse.json(
        { error: 'Missing required field: period (e.g. "week7")' },
        { status: 400 }
      );
    }

    venue = body.venue || 'polymarket';
    imagesDir = path.join(process.cwd(), 'input', body.period);
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body. Expected: { venue?: "polymarket"|"jupiter", period: "week7" }' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const results: { success: string[]; failed: Array<{ file: string; error: string }> } = {
    success: [],
    failed: [],
  };

  // Ensure bucket exists (create if not)
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

  if (!bucketExists) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
    });

    if (createError) {
      return NextResponse.json({
        error: `Failed to create bucket: ${createError.message}`,
      }, { status: 500 });
    }
  }

  // Read all images from directory
  let files: string[];
  try {
    files = fs.readdirSync(imagesDir).filter((f) => f.endsWith('.png'));
  } catch (err) {
    return NextResponse.json({
      error: `Failed to read images directory (${imagesDir}): ${err instanceof Error ? err.message : 'Unknown error'}`,
    }, { status: 500 });
  }

  for (const filename of files) {
    try {
      const slug = filename.replace('.png', '');
      const filePath = path.join(imagesDir, filename);

      // Read file
      const fileBuffer = fs.readFileSync(filePath);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filename, fileBuffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) {
        results.failed.push({ file: filename, error: uploadError.message });
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filename);

      // Update event with image URL — match field depends on venue
      const matchField = venue === 'jupiter' ? 'venue_slug' : 'polymarket_slug';
      const { error: updateError } = await supabase
        .from('events')
        .update({ image_url: urlData.publicUrl })
        .eq(matchField, slug);

      if (updateError) {
        results.failed.push({ file: filename, error: `Upload OK, DB update failed: ${updateError.message}` });
        continue;
      }

      results.success.push(slug);

    } catch (err) {
      results.failed.push({
        file: filename,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    message: 'Image upload completed',
    venue,
    directory: imagesDir,
    total: files.length,
    success: results.success.length,
    failed: results.failed.length,
    results,
  });
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to upload images',
    usage: {
      method: 'POST',
      body: {
        venue: 'polymarket | jupiter (default: polymarket)',
        period: 'week7 (required — reads PNGs from input/{period}/)',
      },
    },
    example: 'curl -X POST http://localhost:3000/api/seed/images -H "Content-Type: application/json" -d \'{"venue":"jupiter","period":"week7"}\'',
  });
}
