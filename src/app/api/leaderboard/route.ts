import { NextResponse } from 'next/server';
import { getCurrentWeekLeaderboard } from '@/lib/supabase/leaderboard';

// GET /api/leaderboard?limit=10&offset=0&anonymousId=xxx
// Returns the current week's leaderboard
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '10', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    const anonymousId = searchParams.get('anonymousId') ?? undefined;

    const result = await getCurrentWeekLeaderboard(limit, offset, anonymousId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
