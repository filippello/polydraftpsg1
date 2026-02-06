/**
 * Script to create the 'images' storage bucket in Supabase
 * Run with: npx tsx scripts/create-storage-bucket.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables:");
  console.error("- NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "OK" : "MISSING");
  console.error("- SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "OK" : "MISSING");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBucket() {
  console.log("Creating 'images' bucket...");

  // Check if bucket already exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error("Error listing buckets:", listError.message);
    process.exit(1);
  }

  const existingBucket = buckets?.find((b) => b.name === "images");

  if (existingBucket) {
    console.log("Bucket 'images' already exists!");
    console.log("Bucket details:", existingBucket);
    return;
  }

  // Create the bucket
  const { data, error } = await supabase.storage.createBucket("images", {
    public: true, // Important: must be public for Twitter to access
    fileSizeLimit: 5 * 1024 * 1024, // 5MB max
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  });

  if (error) {
    console.error("Error creating bucket:", error.message);
    process.exit(1);
  }

  console.log("Bucket created successfully!");
  console.log("Bucket details:", data);

  // Create the 'share' folder by uploading a placeholder (optional)
  console.log("\nBucket 'images' is ready for use.");
  console.log("Share images will be stored at: images/share/bet-{hash}.png");
}

createBucket().catch(console.error);
