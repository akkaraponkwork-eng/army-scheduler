import { generateSchedule } from './src/lib/scheduler';

const personnel = Array.from({length: 100}).map((_, i) => ({ id: i + 1, name: `Person ${i+1}`, status: 'active' as any }));
const exceptions = [];
const punishments = [];
const startDate = '2026-06-27';
const endDate = '2026-06-27';

const assignments = generateSchedule(personnel, exceptions, punishments, startDate, endDate, 1);
console.log(JSON.stringify(assignments.slice(0, 5), null, 2));
