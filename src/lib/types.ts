// ============================================================
// Types for Army Duty Scheduler
// ============================================================

export type PersonnelStatus = 'active' | 'assistant_sergeant' | 'sick' | 'admin_duty';

export interface Personnel {
  id: number;
  name: string;
  status: PersonnelStatus;
}

export type DutyPosition = 'north_armory' | 'central_porch' | 'south_armory';

export interface DutyPositionInfo {
  key: DutyPosition;
  label: string;
  icon: string;
}

export const DUTY_POSITIONS: DutyPositionInfo[] = [
  { key: 'north_armory', label: 'หน้าคลังอาวุธทิศเหนือ', icon: '🔴' },
  { key: 'central_porch', label: 'หน้ามุขกลาง', icon: '🟡' },
  { key: 'south_armory', label: 'หน้าคลังอาวุธทิศใต้', icon: '🟢' },
];

export interface ShiftTime {
  shift: number;
  label: string;
  start: string;
  end: string;
}

export const SHIFT_TIMES: ShiftTime[] = [
  { shift: 1, label: 'ผลัด 1', start: '21:00', end: '23:00' },
  { shift: 2, label: 'ผลัด 2', start: '23:00', end: '01:00' },
  { shift: 3, label: 'ผลัด 3', start: '01:00', end: '03:00' },
  { shift: 4, label: 'ผลัด 4', start: '03:00', end: '05:00' },
];

export interface DutyAssignment {
  date: string;          // YYYY-MM-DD
  shift: number;         // 1-4
  position: DutyPosition;
  person1Id: number | null;
  person2Id: number | null;
}

export interface DailySchedule {
  date: string;
  assignments: DutyAssignment[];
}

export interface ExceptionEntry {
  personnelId: number;
  reason: 'sick' | 'admin_duty';
  startDate: string;
  endDate: string;
}
