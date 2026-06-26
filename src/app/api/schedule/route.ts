import { NextRequest, NextResponse } from 'next/server';
import { getScheduleForMonth, getScheduleForDate, saveSchedule } from '@/lib/googleSheets';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  try {
    if (date) {
      const assignments = await getScheduleForDate(date);
      return NextResponse.json(assignments);
    } else if (year && month) {
      const assignments = await getScheduleForMonth(parseInt(year), parseInt(month));
      return NextResponse.json(assignments);
    } else {
      return NextResponse.json({ error: 'Provide date or year+month params' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const assignments = await request.json();
    await saveSchedule(assignments);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving schedule:', error);
    return NextResponse.json({ error: 'Failed to save schedule' }, { status: 500 });
  }
}
