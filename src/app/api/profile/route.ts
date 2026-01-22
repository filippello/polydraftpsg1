import { NextResponse } from 'next/server';
import {
  getOrCreateAnonymousProfile,
  fetchProfileByAnonymousId,
  updateProfileDisplayName,
} from '@/lib/supabase/profile';

// GET /api/profile?anonymousId=xxx
// Returns profile for the given anonymousId, creating one if it doesn't exist
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const anonymousId = searchParams.get('anonymousId');

    if (!anonymousId) {
      return NextResponse.json(
        { error: 'anonymousId is required' },
        { status: 400 }
      );
    }

    // Get or create the profile
    const result = await getOrCreateAnonymousProfile(anonymousId);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to get or create profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profileId: result.profileId,
      profile: result.profile,
    });
  } catch (error) {
    console.error('Error in GET /api/profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/profile
// Body: { anonymousId: string, displayName?: string }
// Creates or updates a profile
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { anonymousId, displayName } = body as {
      anonymousId: string;
      displayName?: string;
    };

    if (!anonymousId) {
      return NextResponse.json(
        { error: 'anonymousId is required' },
        { status: 400 }
      );
    }

    // Get or create the profile first
    const result = await getOrCreateAnonymousProfile(anonymousId);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to get or create profile' },
        { status: 500 }
      );
    }

    // Update display name if provided
    if (displayName) {
      const updated = await updateProfileDisplayName(result.profileId, displayName);
      if (updated) {
        // Fetch updated profile
        const updatedProfile = await fetchProfileByAnonymousId(anonymousId);
        if (updatedProfile) {
          return NextResponse.json({
            profileId: result.profileId,
            profile: updatedProfile,
          });
        }
      }
    }

    return NextResponse.json({
      profileId: result.profileId,
      profile: result.profile,
    });
  } catch (error) {
    console.error('Error in POST /api/profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
