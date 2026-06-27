// ============================================================
// Google Sheets API Wrapper — Auto-detects Sheet1
// ============================================================
import { google } from 'googleapis';
import { Personnel, PersonnelStatus, DutyAssignment, DutyPosition, ExceptionEntry, PunishmentEntry } from './types';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;
const SCHEDULE_SHEET = 'schedule';
const EXCEPTIONS_SHEET = 'exceptions';
const PUNISHMENTS_SHEET = 'punishments';

// --- In-Memory Cache (TTL: 30 seconds) ---
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const CACHE_TTL = 30000;
const cache = {
  personnel: null as CacheEntry<Personnel[]> | null,
  schedule: new Map<string, CacheEntry<DutyAssignment[]>>(),
  exceptions: null as CacheEntry<ExceptionEntry[]> | null,
  punishments: null as CacheEntry<PunishmentEntry[]> | null,
};
function isCacheValid(timestamp: number) {
  return Date.now() - timestamp < CACHE_TTL;
}
// ------------------------------------------

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
}

async function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

/**
 * Finds the first sheet in the spreadsheet (Sheet1) to use as personnel data.
 * Falls back to 'Sheet1' or 'personnel' if auto-detect fails.
 */
async function getFirstSheetName(): Promise<string> {
  const sheets = await getSheetsClient();
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets.properties.title,sheets.properties.index',
  });

  const allSheets = spreadsheet.data.sheets || [];
  // Filter out our managed sheets
  const managedNames = [SCHEDULE_SHEET, EXCEPTIONS_SHEET, PUNISHMENTS_SHEET];
  const dataSheets = allSheets
    .filter((s) => !managedNames.includes(s.properties?.title || ''))
    .sort((a, b) => (a.properties?.index || 0) - (b.properties?.index || 0));

  if (dataSheets.length > 0) {
    return dataSheets[0].properties?.title || 'Sheet1';
  }
  return 'Sheet1';
}

// Cache the first sheet name to avoid repeated API calls
let cachedFirstSheet: string | null = null;

async function getPersonnelSheet(): Promise<string> {
  if (!cachedFirstSheet) {
    cachedFirstSheet = await getFirstSheetName();
  }
  return cachedFirstSheet;
}

// ============================================================
// Personnel Functions
// ============================================================

export async function getPersonnel(): Promise<Personnel[]> {
  if (cache.personnel && isCacheValid(cache.personnel.timestamp)) {
    return cache.personnel.data;
  }

  const sheets = await getSheetsClient();
  const sheetName = await getPersonnelSheet();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A2:H200`,
  });

  const rows = response.data.values || [];
  const personnel = rows
    .filter((row) => {
      const idCol = row.findIndex(val => val && !isNaN(parseInt(val)));
      return idCol !== -1;
    })
    .map((row) => {
      const idCol = row.findIndex(val => val && !isNaN(parseInt(val)));
      const id = parseInt(row[idCol]);
      const rank = (row[idCol + 1] || '').trim();
      const firstName = (row[idCol + 2] || '').trim();
      const lastName = (row[idCol + 3] || '').trim();
      const remark = (row[idCol + 5] || '').trim();

      const fullName = [rank, firstName, lastName].filter(Boolean).join(' ');

      let status: PersonnelStatus = 'active';
      if (remark.includes('ผู้ช่วยนายสิบ') || remark.includes('ผช.นสบ')) status = 'assistant_sergeant';
      else if (remark.includes('ป่วย')) status = 'sick';
      else if (remark.includes('ธุระการ') || remark.includes('ลา')) status = 'admin_duty';

      return {
        id,
        name: fullName,
        status,
      };
    });

  cache.personnel = { data: personnel, timestamp: Date.now() };
  return personnel;
}

export async function updatePersonnelStatus(
  id: number,
  status: PersonnelStatus
): Promise<void> {
  const sheets = await getSheetsClient();
  const sheetName = await getPersonnelSheet();
  const personnel = await getPersonnel();
  const rowIndex = personnel.findIndex((p) => p.id === id);
  if (rowIndex === -1) throw new Error(`Personnel ID ${id} not found`);

  const rowNumber = rowIndex + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!F${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[status]] },
  });

  // Invalidate cache
  cache.personnel = null;
}

// ============================================================
// Schedule Functions
// ============================================================

export async function getScheduleForMonth(year: number, month: number): Promise<DutyAssignment[]> {
  const cacheKey = `${year}-${month}`;
  const cached = cache.schedule.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  const sheets = await getSheetsClient();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SCHEDULE_SHEET}'!A2:E5000`,
    });

    const rows = response.data.values || [];
    const prefix = `${year}-${String(month).padStart(2, '0')}`;

    const schedule = rows
      .filter((row) => row[0]?.startsWith(prefix))
      .map((row) => {
        const personIds = row[3] && String(row[3]).includes(',') 
          ? String(row[3]).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
          : [row[3] ? parseInt(row[3]) : null, row[4] ? parseInt(row[4]) : null].filter((id): id is number => id !== null && !isNaN(id));
        return {
          date: row[0],
          shift: parseInt(row[1]),
          position: row[2] as DutyPosition,
          personIds,
          person1Id: personIds[0] || null,
          person2Id: personIds[1] || null,
        };
      });

    cache.schedule.set(cacheKey, { data: schedule, timestamp: Date.now() });
    return schedule;
  } catch {
    return [];
  }
}

export async function getScheduleForDate(date: string): Promise<DutyAssignment[]> {
  const sheets = await getSheetsClient();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SCHEDULE_SHEET}'!A2:E5000`,
    });

    const rows = response.data.values || [];
    return rows
      .filter((row) => row[0] === date)
      .map((row) => {
        const personIds = row[3] && String(row[3]).includes(',') 
          ? String(row[3]).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
          : [row[3] ? parseInt(row[3]) : null, row[4] ? parseInt(row[4]) : null].filter((id): id is number => id !== null && !isNaN(id));
        return {
          date: row[0],
          shift: parseInt(row[1]),
          position: row[2] as DutyPosition,
          personIds,
          person1Id: personIds[0] || null,
          person2Id: personIds[1] || null,
        };
      });
  } catch {
    return [];
  }
}

export async function saveSchedule(assignments: DutyAssignment[]): Promise<void> {
  const sheets = await getSheetsClient();

  // Ensure sheets exist before saving
  await ensureSheetsExist();

  let existingRows: string[][] = [];
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SCHEDULE_SHEET}'!A2:E5000`,
    });
    existingRows = response.data.values || [];
  } catch {
    // Sheet was just created, no existing data
  }

  const existingMap = new Map<string, number>();
  existingRows.forEach((row, index) => {
    const key = `${row[0]}_${row[1]}_${row[2]}`;
    existingMap.set(key, index + 2);
  });

  const updates: Array<{ range: string; values: string[][] }> = [];
  const newRows: string[][] = [];

  for (const assignment of assignments) {
    const key = `${assignment.date}_${assignment.shift}_${assignment.position}`;
    const rowValue = [
      assignment.date,
      String(assignment.shift),
      assignment.position,
      assignment.personIds.join(', '),
      '',
    ];

    if (existingMap.has(key)) {
      const rowNum = existingMap.get(key)!;
      updates.push({
        range: `'${SCHEDULE_SHEET}'!A${rowNum}:E${rowNum}`,
        values: [rowValue],
      });
    } else {
      newRows.push(rowValue);
    }
  }

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates,
      },
    });
  }

  if (newRows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SCHEDULE_SHEET}'!A:E`,
      valueInputOption: 'RAW',
      requestBody: { values: newRows },
    });
  }

  // Invalidate all schedule caches since any month could be affected
  cache.schedule.clear();
}

// ============================================================
// Exceptions Functions
// ============================================================

export async function getExceptions(): Promise<ExceptionEntry[]> {
  if (cache.exceptions && isCacheValid(cache.exceptions.timestamp)) {
    return cache.exceptions.data;
  }

  const sheets = await getSheetsClient();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${EXCEPTIONS_SHEET}'!A2:D500`,
    });

    const rows = response.data.values || [];
    const exceptions = rows
      .filter((row) => row[0])
      .map((row) => ({
        personnelId: parseInt(row[0]),
        reason: row[1] as 'sick' | 'admin_duty',
        startDate: row[2],
        endDate: row[3],
      }));

    cache.exceptions = { data: exceptions, timestamp: Date.now() };
    return exceptions;
  } catch {
    return [];
  }
}

export async function saveException(entry: ExceptionEntry): Promise<void> {
  const sheets = await getSheetsClient();
  await ensureSheetsExist();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${EXCEPTIONS_SHEET}'!A:D`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        String(entry.personnelId),
        entry.reason,
        entry.startDate,
        entry.endDate,
      ]],
    },
  });
  
  cache.exceptions = null;
}

export async function removeException(personnelId: number, startDate: string): Promise<void> {
  const sheets = await getSheetsClient();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${EXCEPTIONS_SHEET}'!A2:D500`,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(
      (row) => parseInt(row[0]) === personnelId && row[2] === startDate
    );

    if (rowIndex !== -1) {
      const rowNum = rowIndex + 2;
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${EXCEPTIONS_SHEET}'!A${rowNum}:D${rowNum}`,
      });
      cache.exceptions = null;
    }
  } catch {
    // Sheet doesn't exist or other error
  }
}

// ============================================================
// Punishments Functions
// ============================================================

export async function getPunishments(): Promise<PunishmentEntry[]> {
  if (cache.punishments && isCacheValid(cache.punishments.timestamp)) {
    return cache.punishments.data;
  }

  const sheets = await getSheetsClient();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${PUNISHMENTS_SHEET}'!A2:D500`,
    });

    const rows = response.data.values || [];
    const punishments = rows
      .filter((row) => row[0])
      .map((row) => ({
        personnelId: parseInt(row[0]),
        shift: parseInt(row[1]),
        startDate: row[2],
        endDate: row[3],
      }));

    cache.punishments = { data: punishments, timestamp: Date.now() };
    return punishments;
  } catch {
    return [];
  }
}

export async function savePunishments(entries: PunishmentEntry[]): Promise<void> {
  const sheets = await getSheetsClient();
  await ensureSheetsExist();
  
  const values = entries.map((entry) => [
    String(entry.personnelId),
    String(entry.shift),
    entry.startDate,
    entry.endDate,
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${PUNISHMENTS_SHEET}'!A:D`,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
  
  cache.punishments = null;
}

export async function removePunishment(personnelId: number, startDate: string): Promise<void> {
  const sheets = await getSheetsClient();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${PUNISHMENTS_SHEET}'!A2:D500`,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(
      (row) => parseInt(row[0]) === personnelId && row[2] === startDate
    );

    if (rowIndex !== -1) {
      const rowNum = rowIndex + 2;
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${PUNISHMENTS_SHEET}'!A${rowNum}:D${rowNum}`,
      });
      cache.punishments = null;
    }
  } catch {
    // Sheet doesn't exist or other error
  }
}

// ============================================================
// Ensure required sheets exist — auto-creates them
// ============================================================
let sheetsInitialized = false;

export async function ensureSheetsExist(): Promise<void> {
  if (sheetsInitialized) return;

  const sheets = await getSheetsClient();
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets.properties.title',
  });

  const existingSheets = spreadsheet.data.sheets?.map((s) => s.properties?.title) || [];
  const requests: Array<Record<string, unknown>> = [];

  if (!existingSheets.includes(SCHEDULE_SHEET)) {
    requests.push({ addSheet: { properties: { title: SCHEDULE_SHEET } } });
  }
  if (!existingSheets.includes(EXCEPTIONS_SHEET)) {
    requests.push({ addSheet: { properties: { title: EXCEPTIONS_SHEET } } });
  }
  if (!existingSheets.includes(PUNISHMENTS_SHEET)) {
    requests.push({ addSheet: { properties: { title: PUNISHMENTS_SHEET } } });
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests },
    });

    // Add headers for new sheets
    const headerUpdates = [];
    if (!existingSheets.includes(SCHEDULE_SHEET)) {
      headerUpdates.push(
        sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `'${SCHEDULE_SHEET}'!A1:E1`,
          valueInputOption: 'RAW',
          requestBody: { values: [['วันที่', 'ผลัด', 'ตำแหน่ง', 'รายชื่อรหัส (คั่นด้วยคอมมา)']] },
        })
      );
    }
    if (!existingSheets.includes(EXCEPTIONS_SHEET)) {
      headerUpdates.push(
        sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `'${EXCEPTIONS_SHEET}'!A1:D1`,
          valueInputOption: 'RAW',
          requestBody: { values: [['รหัส', 'เหตุผล', 'วันที่เริ่ม', 'วันที่สิ้นสุด']] },
        })
      );
    }
    if (!existingSheets.includes(PUNISHMENTS_SHEET)) {
      headerUpdates.push(
        sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `'${PUNISHMENTS_SHEET}'!A1:D1`,
          valueInputOption: 'RAW',
          requestBody: { values: [['รหัส', 'ผลัด', 'วันที่เริ่ม', 'วันที่สิ้นสุด']] },
        })
      );
    }
    await Promise.all(headerUpdates);
  }

  // Ensure the first sheet (personnel data) has headers
  const personnelSheet = await getPersonnelSheet();
  if (existingSheets.includes(personnelSheet)) {
    try {
      const headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${personnelSheet}'!A1:F1`,
      });
      if (!headerResponse.data.values?.[0]?.[0]) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `'${personnelSheet}'!A1:F1`,
          valueInputOption: 'RAW',
          requestBody: { values: [['รหัส', 'ยศ', 'ชื่อ', 'สกุล', 'หน่วย', 'หมายเหตุ']] },
        });
      }
    } catch {
      // Column check failed, try adding anyway
    }
  }

  sheetsInitialized = true;
}
