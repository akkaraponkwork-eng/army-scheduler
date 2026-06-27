import { getScheduleForMonth, getPersonnel } from './src/lib/googleSheets';

async function main() {
  const personnel = await getPersonnel();
  console.log(`Personnel count: ${personnel.length}`);
  
  const schedule = await getScheduleForMonth(2026, 6); // Assuming June 2026
  console.log(`Schedule items for June: ${schedule.length}`);
  
  if (schedule.length > 0) {
    console.log(JSON.stringify(schedule.slice(0, 5), null, 2));
  }
}

main().catch(console.error);
