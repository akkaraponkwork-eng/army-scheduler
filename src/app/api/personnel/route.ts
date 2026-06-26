import { NextResponse } from 'next/server';
import { getPersonnel, ensureSheetsExist } from '@/lib/googleSheets';

export async function GET() {
  try {
    // Initialize sheets on first request
    await ensureSheetsExist();
    const personnel = await getPersonnel();
    return NextResponse.json(personnel);
  } catch (error) {
    console.error('Error fetching personnel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personnel', detail: String(error) },
      { status: 500 }
    );
  }
}
