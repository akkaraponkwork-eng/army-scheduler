import { NextRequest, NextResponse } from 'next/server';
import { getExceptions, saveException, removeException } from '@/lib/googleSheets';

export async function GET() {
  try {
    const exceptions = await getExceptions();
    return NextResponse.json(exceptions);
  } catch (error) {
    console.error('Error fetching exceptions:', error);
    return NextResponse.json({ error: 'Failed to fetch exceptions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const entry = await request.json();
    await saveException(entry);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving exception:', error);
    return NextResponse.json({ error: 'Failed to save exception' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { personnelId, startDate } = await request.json();
    await removeException(personnelId, startDate);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing exception:', error);
    return NextResponse.json({ error: 'Failed to remove exception' }, { status: 500 });
  }
}
