import { NextResponse } from 'next/server';
import { getPunishments, savePunishments, removePunishment, ensureSheetsExist } from '@/lib/googleSheets';

export async function GET() {
  try {
    await ensureSheetsExist();
    const punishments = await getPunishments();
    return NextResponse.json(punishments);
  } catch (error) {
    console.error('Error fetching punishments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch punishments', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const entries = await request.json();
    if (!Array.isArray(entries)) {
      return NextResponse.json({ error: 'Expected an array of entries' }, { status: 400 });
    }
    await savePunishments(entries);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving punishments:', error);
    return NextResponse.json(
      { error: 'Failed to save punishments', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { personnelId, startDate } = await request.json();
    if (!personnelId || !startDate) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
    await removePunishment(personnelId, startDate);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing punishment:', error);
    return NextResponse.json(
      { error: 'Failed to remove punishment', detail: String(error) },
      { status: 500 }
    );
  }
}
