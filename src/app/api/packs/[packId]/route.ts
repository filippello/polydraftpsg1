import { NextResponse } from 'next/server';
import {
  getPackById,
  updatePackResolution,
  markPickRevealed,
} from '@/lib/supabase/packs';

// GET /api/packs/[packId]
// Returns the pack with its picks
export async function GET(
  request: Request,
  { params }: { params: { packId: string } }
) {
  try {
    const { packId } = params;

    const pack = await getPackById(packId);

    if (!pack) {
      return NextResponse.json(
        { error: 'Pack not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ pack });
  } catch (error) {
    console.error('Error in GET /api/packs/[packId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/packs/[packId]
// Updates pack resolution status or marks picks as revealed
// Body: { action: 'update_resolution' | 'mark_revealed', data: {...} }
export async function PATCH(
  request: Request,
  { params }: { params: { packId: string } }
) {
  try {
    const { packId } = params;
    const body = await request.json();
    const { action, data } = body as {
      action: 'update_resolution' | 'mark_revealed';
      data: Record<string, unknown>;
    };

    if (action === 'update_resolution') {
      const { status, totalPoints, correctPicks } = data as {
        status: 'pending' | 'partially_resolved' | 'fully_resolved';
        totalPoints?: number;
        correctPicks?: number;
      };

      const success = await updatePackResolution(
        packId,
        status,
        totalPoints,
        correctPicks
      );

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update pack resolution' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'mark_revealed') {
      const { pickId } = data as { pickId: string };

      const success = await markPickRevealed(pickId);

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to mark pick revealed' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in PATCH /api/packs/[packId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
