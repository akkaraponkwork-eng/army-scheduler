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

  // Track rotation pointer across all days by ID instead of index
  // to avoid skipping people when activeToday changes size
  let currentPointerId = startFromId;
  const activeForStart = getActivePersonnel(allPersonnel, exceptions, startDate);
  const startIdx = activeForStart.findIndex((p) => p.id >= startFromId);
  if (startIdx >= 0) {
    currentPointerId = activeForStart[startIdx].id;
  }

  // Iterate through each day
  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dateStr = formatDate(current);
    
    // Find all punished personnel for today across all shifts
    const punishedAllDay = punishments.filter(p => p.startDate <= dateStr && p.endDate >= dateStr);
    const punishedIdsAllDay = punishedAllDay.map(p => p.personnelId);
    
    // Get active personnel today, but EXCLUDE anyone who is punished today
    let activeToday = getActivePersonnel(allPersonnel, exceptions, dateStr);
    activeToday = activeToday.filter(p => !punishedIdsAllDay.includes(p.id));

    // Normal logic: For each shift (1-4)
    for (let shift = 1; shift <= 4; shift++) {
      const punishedTodayForShift = punishedAllDay.filter(p => p.shift === shift);
      const punishedPersonnel = punishedTodayForShift.map(p => allPersonnel.find(x => x.id === p.personnelId)).filter(Boolean) as Personnel[];
      
      const assignedForThisShift: Personnel[] = [];
      
      if (punishedPersonnel.length > 0) {
        // This is a punishment shift!
        for (const p of punishedPersonnel) {
           assignedForThisShift.push(p);
        }
      } else {
        // Normal shift: draw 6 from activeToday (if available)
        if (activeToday.length > 0) {
          let attempts = 0;
          while (assignedForThisShift.length < 6 && attempts < activeToday.length * 2) {
            let idx = activeToday.findIndex(p => p.id >= currentPointerId);
            if (idx === -1) idx = 0; // Wrap around to start if no one has id >= currentPointerId
            
            const p = activeToday[idx];
            
            // Move pointer to the next person for the next draw
            if (idx + 1 < activeToday.length) {
              currentPointerId = activeToday[idx + 1].id;
            } else {
              currentPointerId = activeToday[0].id;
            }

            if (!assignedForThisShift.find(x => x.id === p.id)) {
              assignedForThisShift.push(p);
            }
            attempts++;
          }
        }
      }
      
      // Distribute `assignedForThisShift` into the 3 positions
      const posCount = positions.length;
      const distribution = Array(posCount).fill(0).map(() => [] as Personnel[]);
      
      const perPos = Math.floor(assignedForThisShift.length / posCount);
      const remainder = assignedForThisShift.length % posCount;
      let currentIdx = 0;
      for (let i = 0; i < posCount; i++) {
        const countForThisPos = perPos + (i < remainder ? 1 : 0);
        distribution[i] = assignedForThisShift.slice(currentIdx, currentIdx + countForThisPos);
        currentIdx += countForThisPos;
      }
      
      for (let i = 0; i < posCount; i++) {
        assignments.push({
          date: dateStr,
          shift,
          position: positions[i],
          personIds: distribution[i].map(p => p.id),
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
  personnel: Personnel[],
  exceptions: ExceptionEntry[] = []
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
  text += `──────────────\n\n`;

  const dailyAssistants = exceptions
    .filter(e => e.reason === 'ผู้ช่วยสิบเวร' && e.startDate <= date && e.endDate >= date)
    .map(e => personnelMap.get(e.personnelId))
    .filter(Boolean) as Personnel[];

  if (dailyAssistants.length > 0) {
    text += `⭐ ผู้ช่วยสิบเวรประจำวัน\n`;
    for (const p of dailyAssistants) {
      const formattedName = p.name.startsWith('พลฯ') ? p.name : `พลฯ ${p.name}`;
      text += `     ${String(p.id).padStart(3, '0')} ${formattedName}\n`;
    }
    text += `\n`;
  }


  for (const shiftInfo of SHIFT_TIMES) {
    const shiftAssignments = assignments.filter((a) => a.shift === shiftInfo.shift);
    if (shiftAssignments.length === 0) continue;

    text += `⏰ ${shiftInfo.label} (${shiftInfo.time})\n\n`;

    const positions: DutyPosition[] = ['north_armory', 'central_porch', 'south_armory'];
    for (const pos of positions) {
      const a = shiftAssignments.find((x) => x.position === pos);
      if (!a) continue;

      const pList = a.personIds.map(id => personnelMap.get(id)).filter(Boolean) as Personnel[];

      text += `  ${POSITION_ICONS[pos]} ${POSITION_LABELS[pos]}\n`;
      if (pList.length === 0) {
        text += `     -\n`;
      } else {
        for (const p of pList) {
          // Check if name already has 'พลฯ' or similar title, if not we just output the name as is
          // since we don't know the exact title, we'll just output ID followed by Name.
          // If the user wants 'พลฯ' hardcoded we can add it, but it's safer to just output what's in the DB.
          // If they don't have titles in the DB, it will output "076 ศุภณัฐ". The prompt has "076 พลฯ ศุภณัฐ".
          // I'll add "พลฯ " if the name doesn't start with it just in case, or just leave it.
          // Actually, let's just do `ID Name`. If the DB has `พลฯ ศุภณัฐ`, it will print `076 พลฯ ศุภณัฐ`.
          // If the DB has `ศุภณัฐ`, it will print `076 ศุภณัฐ`. I'll assume the title is either in the name or they just want ID + Name.
          // Wait, the user specifically wrote "076 พลฯ ศุภณัฐ พุกำพันธ์". Let's check if we should inject 'พลฯ '.
          // I will output exactly `${String(p.id).padStart(3, '0')} ${p.name}` first. 
          // If I need to force "พลฯ", I can do: `p.name.startsWith('พลฯ') ? p.name : 'พลฯ ' + p.name`. Let's do that for safety to match the requested format exactly.
          const formattedName = p.name.startsWith('พลฯ') ? p.name : `พลฯ ${p.name}`;
          text += `     ${String(p.id).padStart(3, '0')} ${formattedName}\n`;
        }
      }
      text += '\n'; // Empty line after each position
    }
  }

  return text.trimEnd();
}
