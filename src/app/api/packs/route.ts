import { NextResponse } from 'next/server';
import {
  createPackWithPicks,
  getPacksByProfileId,
  packExists,
  getWeeklyPackStatus,
  WEEKLY_PACK_LIMIT,
} from '@/lib/supabase/packs';
import { fetchProfileByAnonymousId } from '@/lib/supabase/profile';
import type { Outcome } from '@/types';

// POST /api/packs
// Body: { anonymousId, pack, picks }
// Creates a new pack with its picks
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { anonymousId, pack, picks } = body as {
      anonymousId: string;
      pack: {
        id: string;
        packTypeId: string;
        packTypeSlug: string;
        openedAt: string;
      };
      picks: Array<{
        id: string;
        eventId: string;
        position: number;
        pickedOutcome: Outcome;
        pickedAt: string;
        probabilitySnapshot: number;
        oppositeProbabilitySnapshot: number;
        drawProbabilitySnapshot?: number;
      }>;
    };

    if (!anonymousId) {
      return NextResponse.json(
        { error: 'anonymousId is required' },
        { status: 400 }
      );
    }

    if (!pack || !picks) {
      return NextResponse.json(
        { error: 'pack and picks are required' },
        { status: 400 }
      );
    }

    // Check if pack already exists (idempotency)
    const exists = await packExists(pack.id);
    if (exists) {
      return NextResponse.json({
        success: true,
        packId: pack.id,
        alreadyExists: true,
      });
    }

    // Get the profile for this anonymous user
    const profile = await fetchProfileByAnonymousId(anonymousId);
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found. Please ensure profile is initialized first.' },
        { status: 404 }
      );
    }

    // Check weekly pack limit
    const weeklyStatus = await getWeeklyPackStatus(profile.id);
    if (!weeklyStatus.canOpenPack) {
      return NextResponse.json(
        {
          error: 'Weekly pack limit reached',
          code: 'WEEKLY_LIMIT_REACHED',
          weeklyStatus,
        },
        { status: 429 }
      );
    }

    // Create the pack with picks
    const result = await createPackWithPicks(
      {
        id: pack.id,
        profileId: profile.id,
        anonymousId: anonymousId,
        packTypeSlug: pack.packTypeSlug,
        openedAt: pack.openedAt,
      },
      picks.map((pick) => ({
        id: pick.id,
        eventId: pick.eventId,
        position: pick.position,
        pickedOutcome: pick.pickedOutcome,
        pickedAt: pick.pickedAt,
        probabilitySnapshot: pick.probabilitySnapshot,
        oppositeProbabilitySnapshot: pick.oppositeProbabilitySnapshot,
        drawProbabilitySnapshot: pick.drawProbabilitySnapshot,
      }))
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create pack' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      packId: result.packId,
      alreadyExists: false,
    });
  } catch (error) {
    console.error('Error in POST /api/packs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/packs?anonymousId=xxx
// Returns all packs for the given anonymousId plus weekly status
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

    // Get the profile for this anonymous user
    const profile = await fetchProfileByAnonymousId(anonymousId);
    if (!profile) {
      return NextResponse.json({
        packs: [],
        weeklyStatus: {
          packsOpenedThisWeek: 0,
          packsRemaining: WEEKLY_PACK_LIMIT,
          canOpenPack: true,
          weeklyLimit: WEEKLY_PACK_LIMIT,
        },
      });
    }

    // Get all packs for this profile
    const packs = await getPacksByProfileId(profile.id);

    // Get weekly status
    const weeklyStatus = await getWeeklyPackStatus(profile.id);

    return NextResponse.json({
      packs,
      weeklyStatus,
    });
  } catch (error) {
    console.error('Error in GET /api/packs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
