import { NextResponse } from 'next/server';
import { getWeeklyPackStatus, WEEKLY_PACK_LIMIT } from '@/lib/supabase/packs';
import { fetchProfileByAnonymousId } from '@/lib/supabase/profile';

// GET /api/packs/availability?anonymousId=xxx
// Returns the weekly pack status for the user
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
      // No profile yet = can open packs
      return NextResponse.json({
        packsOpenedThisWeek: 0,
        packsRemaining: WEEKLY_PACK_LIMIT,
        canOpenPack: true,
        weeklyLimit: WEEKLY_PACK_LIMIT,
      });
    }

    // Get weekly status
    const weeklyStatus = await getWeeklyPackStatus(profile.id);

    return NextResponse.json(weeklyStatus);
  } catch (error) {
    console.error('Error in GET /api/packs/availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
