import { NextRequest, NextResponse } from 'next/server';
import { getPersonnel, getExceptions, getPunishments, saveSchedule, saveException } from '@/lib/googleSheets';
import { generateSchedule } from '@/lib/scheduler';

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate, startFromId, assistantSergeants } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    if (assistantSergeants && Array.isArray(assistantSergeants) && assistantSergeants.length > 0) {
      // Save assistant sergeants as exceptions first
      for (const id of assistantSergeants) {
        await saveException({
          personnelId: id,
          startDate: startDate,
          endDate: startDate, // Apply only for this single day
          reason: 'ผู้ช่วยสิบเวร',
        });
      }
    }

    const [personnel, exceptions, punishments] = await Promise.all([
      getPersonnel(),
      getExceptions(),
      getPunishments(),
    ]);

    const assignments = generateSchedule(
      personnel,
      exceptions,
      punishments,
      startDate,
      endDate,
      startFromId || 1
    );

    await saveSchedule(assignments);

    return NextResponse.json({
      success: true,
      count: assignments.length,
    });
  } catch (error) {
    console.error('Error generating schedule:', error);
    return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 });
  }
}
