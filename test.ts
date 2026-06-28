import { generateSchedule } from './src/lib/scheduler';

const personnel = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: `Person ${i + 1}`,
  status: 'active' as const
}));

const exceptions = [];
const punishments = Array.from({ length: 8 }, (_, i) => ({
  personnelId: i + 1,
  shift: 3,
  startDate: '2026-06-28',
  endDate: '2026-06-28'
}));

const assignments = generateSchedule(personnel, exceptions, punishments, '2026-06-28', '2026-06-28', 9);
console.log(JSON.stringify(assignments, null, 2));
