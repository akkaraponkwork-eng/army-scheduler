// ============================================================
// Army Duty Scheduler Algorithm
// ============================================================
import { Personnel, DutyAssignment, DutyPosition, DUTY_POSITIONS, ExceptionEntry, PunishmentEntry } from './types';

/**
 * Get active personnel (excluding those exempt from duty)
 * on a given date
 */
export function getActivePersonnel(
  personnel: Personnel[],
  exceptions: ExceptionEntry[],
  date: string
): Personnel[] {
  // Filter out permanently exempt (assistant_sergeant)
  const active = personnel.filter((p) => p.status === 'active');

  // Filter out temporary exceptions for this date
  return active.filter((p) => {
    const ex = exceptions.find(
      (e) =>
        e.personnelId === p.id &&
        e.startDate <= date &&
        e.endDate >= date
    );
    return !ex;
  });
}

/**
 * Auto-generate duty schedule for a date range.
 * Rotates through personnel by ID, 6 people per shift (2 per position × 3 positions × 4 shifts = 24 per day).
 */
export function generateSchedule(
  personnel: Personnel[],
  exceptions: ExceptionEntry[],
  punishments: PunishmentEntry[],
  startDate: string,
  endDate: string,
  startFromId: number = 1
): DutyAssignment[] {
  const assignments: DutyAssignment[] = [];
  const positions: DutyPosition[] = DUTY_POSITIONS.map((p) => p.key);

  // Build sorted active personnel list
  const allPersonnel = [...personnel].sort((a, b) => a.id - b.id);

  // Track rotation pointer across all days
  // We'll use a different approach: track a global queue position
  let queuePointer = 0;

  // Calculate initial pointer position based on startFromId
  const activeForStart = getActivePersonnel(allPersonnel, exceptions, startDate);
  const startIdx = activeForStart.findIndex((p) => p.id >= startFromId);
  if (startIdx >= 0) queuePointer = startIdx;

  // Iterate through each day
  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dateStr = formatDate(current);
    const activeToday = getActivePersonnel(allPersonnel, exceptions, dateStr);

    if (activeToday.length === 0) {
      current.setDate(current.getDate() + 1);
      continue;
    }

    // For each shift (1-4)
    for (let shift = 1; shift <= 4; shift++) {
      const punishedToday = punishments.filter(p => p.startDate <= dateStr && p.endDate >= dateStr && p.shift === shift);
      const punishedPersonnel = punishedToday.map(p => allPersonnel.find(x => x.id === p.personnelId)).filter(Boolean) as Personnel[];
      
      const assignedForThisShift: Personnel[] = [];
      
      for (const p of punishedPersonnel) {
        if (assignedForThisShift.length < 6 && !assignedForThisShift.find(x => x.id === p.id)) {
          assignedForThisShift.push(p);
        }
      }
      
      let attempts = 0;
      while (assignedForThisShift.length < 6 && attempts < activeToday.length * 2) {
        const p = activeToday[queuePointer % activeToday.length];
        queuePointer = (queuePointer + 1) % activeToday.length;
        if (!assignedForThisShift.find(x => x.id === p.id)) {
          assignedForThisShift.push(p);
        }
        attempts++;
      }
      
      while (assignedForThisShift.length < 6) {
        assignedForThisShift.push(undefined as any);
      }
      
      let idx = 0;
      for (const position of positions) {
        const person1 = assignedForThisShift[idx++];
        const person2 = assignedForThisShift[idx++];

        assignments.push({
          date: dateStr,
          shift,
          position,
          person1Id: person1?.id ?? null,
          person2Id: person2?.id ?? null,
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return assignments;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format schedule as plain text for copy
 */
export function formatScheduleText(
  date: string,
  assignments: DutyAssignment[],
  personnel: Personnel[]
): string {
  const SHIFT_TIMES = [
    { shift: 1, label: 'ผลัด 1', time: '21:00-23:00' },
    { shift: 2, label: 'ผลัด 2', time: '23:00-01:00' },
    { shift: 3, label: 'ผลัด 3', time: '01:00-03:00' },
    { shift: 4, label: 'ผลัด 4', time: '03:00-05:00' },
  ];

  const POSITION_LABELS: Record<DutyPosition, string> = {
    north_armory: 'คลังอาวุธทิศเหนือ',
    central_porch: 'มุขกลาง',
    south_armory: 'คลังอาวุธทิศใต้',
  };

  const POSITION_ICONS: Record<DutyPosition, string> = {
    north_armory: '🔴',
    central_porch: '🟡',
    south_armory: '🟢',
  };

  const personnelMap = new Map(personnel.map((p) => [p.id, p]));

  // Format date in Thai format
  const dateObj = new Date(date);
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const thaiYear = dateObj.getFullYear() + 543;
  const thaiDate = `${dateObj.getDate()} ${thaiMonths[dateObj.getMonth()]} ${thaiYear}`;

  let text = `📅 เวรประจำวันที่ ${thaiDate}\n`;
  text += `${'─'.repeat(35)}\n\n`;

  for (const shiftInfo of SHIFT_TIMES) {
    const shiftAssignments = assignments.filter((a) => a.shift === shiftInfo.shift);
    if (shiftAssignments.length === 0) continue;

    text += `⏰ ${shiftInfo.label} (${shiftInfo.time})\n`;

    const positions: DutyPosition[] = ['north_armory', 'central_porch', 'south_armory'];
    for (const pos of positions) {
      const a = shiftAssignments.find((x) => x.position === pos);
      if (!a) continue;

      const p1 = a.person1Id ? personnelMap.get(a.person1Id) : null;
      const p2 = a.person2Id ? personnelMap.get(a.person2Id) : null;

      const p1Text = p1 ? `${p1.name} (${String(p1.id).padStart(3, '0')})` : '-';
      const p2Text = p2 ? `${p2.name} (${String(p2.id).padStart(3, '0')})` : '-';

      text += `  ${POSITION_ICONS[pos]} ${POSITION_LABELS[pos]}\n`;
      text += `     • ${p1Text}\n`;
      text += `     • ${p2Text}\n`;
    }
    text += '\n';
  }

  return text.trimEnd();
}
