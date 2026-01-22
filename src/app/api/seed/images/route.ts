/**
 * Seed API Route - Upload Event Images
 *
 * POST /api/seed/images
 * Uploads event images to Supabase Storage and updates event records
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

const IMAGES_DIR = path.join(process.cwd(), 'input', 'images');
const BUCKET_NAME = 'event-images';

export async function POST() {
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
    files = fs.readdirSync(IMAGES_DIR).filter((f) => f.endsWith('.png'));
  } catch (err) {
    return NextResponse.json({
      error: `Failed to read images directory: ${err instanceof Error ? err.message : 'Unknown error'}`,
    }, { status: 500 });
  }

  for (const filename of files) {
    try {
      const slug = filename.replace('.png', '');
      const filePath = path.join(IMAGES_DIR, filename);

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

      // Update event with image URL
      const { error: updateError } = await supabase
        .from('events')
        .update({ image_url: urlData.publicUrl })
        .eq('polymarket_slug', slug);

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
    total: files.length,
    success: results.success.length,
    failed: results.failed.length,
    results,
  });
}

export async function GET() {
  // List available images
  let files: string[];
  try {
    files = fs.readdirSync(IMAGES_DIR).filter((f) => f.endsWith('.png'));
  } catch {
    files = [];
  }

  return NextResponse.json({
    message: 'POST to this endpoint to upload images',
    images_found: files.length,
    files,
  });
}
