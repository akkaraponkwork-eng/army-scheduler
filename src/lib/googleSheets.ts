// ============================================================
// Google Sheets API Wrapper
// ============================================================
import { google } from 'googleapis';
import { Personnel, PersonnelStatus, DutyAssignment, DutyPosition, ExceptionEntry } from './types';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;
const PERSONNEL_SHEET = 'personnel';
const SCHEDULE_SHEET = 'schedule';
const EXCEPTIONS_SHEET = 'exceptions';

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

// ============================================================
// Personnel Functions
// ============================================================

export async function getPersonnel(): Promise<Personnel[]> {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${PERSONNEL_SHEET}!A2:C200`,
  });

  const rows = response.data.values || [];
  return rows
    .filter((row) => row[0] && row[1])
    .map((row) => ({
      id: parseInt(row[0]),
      name: row[1] || '',
      status: (row[2] as PersonnelStatus) || 'active',
    }));
}

export async function updatePersonnelStatus(
  id: number,
  status: PersonnelStatus
): Promise<void> {
  const sheets = await getSheetsClient();
  // Find the row number for this personnel ID
  const personnel = await getPersonnel();
  const rowIndex = personnel.findIndex((p) => p.id === id);
  if (rowIndex === -1) throw new Error(`Personnel ID ${id} not found`);

  const rowNumber = rowIndex + 2; // +2 for header row and 1-indexed
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${PERSONNEL_SHEET}!C${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[status]] },
  });
}

// ============================================================
// Schedule Functions
// ============================================================

export async function getScheduleForMonth(year: number, month: number): Promise<DutyAssignment[]> {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SCHEDULE_SHEET}!A2:E5000`,
  });

  const rows = response.data.values || [];
  const prefix = `${year}-${String(month).padStart(2, '0')}`;

  return rows
    .filter((row) => row[0]?.startsWith(prefix))
    .map((row) => ({
      date: row[0],
      shift: parseInt(row[1]),
      position: row[2] as DutyPosition,
      person1Id: row[3] ? parseInt(row[3]) : null,
      person2Id: row[4] ? parseInt(row[4]) : null,
    }));
}

export async function getScheduleForDate(date: string): Promise<DutyAssignment[]> {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SCHEDULE_SHEET}!A2:E5000`,
  });

  const rows = response.data.values || [];
  return rows
    .filter((row) => row[0] === date)
    .map((row) => ({
      date: row[0],
      shift: parseInt(row[1]),
      position: row[2] as DutyPosition,
      person1Id: row[3] ? parseInt(row[3]) : null,
      person2Id: row[4] ? parseInt(row[4]) : null,
    }));
}

export async function saveSchedule(assignments: DutyAssignment[]): Promise<void> {
  const sheets = await getSheetsClient();

  // Get current data to find rows to update or append
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SCHEDULE_SHEET}!A2:E5000`,
  });

  const existingRows = response.data.values || [];
  const existingMap = new Map<string, number>();
  existingRows.forEach((row, index) => {
    const key = `${row[0]}_${row[1]}_${row[2]}`;
    existingMap.set(key, index + 2); // +2 for header and 1-indexed
  });

  // Separate into updates and appends
  const updates: Array<{ range: string; values: string[][] }> = [];
  const newRows: string[][] = [];

  for (const assignment of assignments) {
    const key = `${assignment.date}_${assignment.shift}_${assignment.position}`;
    const rowValue = [
      assignment.date,
      String(assignment.shift),
      assignment.position,
      assignment.person1Id !== null ? String(assignment.person1Id) : '',
      assignment.person2Id !== null ? String(assignment.person2Id) : '',
    ];

    if (existingMap.has(key)) {
      const rowNum = existingMap.get(key)!;
      updates.push({
        range: `${SCHEDULE_SHEET}!A${rowNum}:E${rowNum}`,
        values: [rowValue],
      });
    } else {
      newRows.push(rowValue);
    }
  }

  // Execute batch update
  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates,
      },
    });
  }

  // Append new rows
  if (newRows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SCHEDULE_SHEET}!A:E`,
      valueInputOption: 'RAW',
      requestBody: { values: newRows },
    });
  }
}

// ============================================================
// Exceptions Functions
// ============================================================

export async function getExceptions(): Promise<ExceptionEntry[]> {
  const sheets = await getSheetsClient();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${EXCEPTIONS_SHEET}!A2:D500`,
    });

    const rows = response.data.values || [];
    return rows
      .filter((row) => row[0])
      .map((row) => ({
        personnelId: parseInt(row[0]),
        reason: row[1] as 'sick' | 'admin_duty',
        startDate: row[2],
        endDate: row[3],
      }));
  } catch {
    return [];
  }
}

export async function saveException(entry: ExceptionEntry): Promise<void> {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${EXCEPTIONS_SHEET}!A:D`,
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
}

export async function removeException(personnelId: number, startDate: string): Promise<void> {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${EXCEPTIONS_SHEET}!A2:D500`,
  });

  const rows = response.data.values || [];
  const rowIndex = rows.findIndex(
    (row) => parseInt(row[0]) === personnelId && row[2] === startDate
  );

  if (rowIndex !== -1) {
    const rowNum = rowIndex + 2;
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${EXCEPTIONS_SHEET}!A${rowNum}:D${rowNum}`,
    });
  }
}

// Ensure required sheets exist
export async function ensureSheetsExist(): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });

  const existingSheets = spreadsheet.data.sheets?.map((s) => s.properties?.title) || [];
  const sheetsToCreate = [];

  if (!existingSheets.includes(SCHEDULE_SHEET)) {
    sheetsToCreate.push({ addSheet: { properties: { title: SCHEDULE_SHEET } } });
  }
  if (!existingSheets.includes(EXCEPTIONS_SHEET)) {
    sheetsToCreate.push({ addSheet: { properties: { title: EXCEPTIONS_SHEET } } });
  }

  if (sheetsToCreate.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: sheetsToCreate },
    });

    // Add headers for schedule sheet
    if (!existingSheets.includes(SCHEDULE_SHEET)) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SCHEDULE_SHEET}!A1:E1`,
        valueInputOption: 'RAW',
        requestBody: { values: [['วันที่', 'ผลัด', 'ตำแหน่ง', 'รหัสคนที่1', 'รหัสคนที่2']] },
      });
    }
    // Add headers for exceptions sheet
    if (!existingSheets.includes(EXCEPTIONS_SHEET)) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${EXCEPTIONS_SHEET}!A1:D1`,
        valueInputOption: 'RAW',
        requestBody: { values: [['รหัส', 'เหตุผล', 'วันที่เริ่ม', 'วันที่สิ้นสุด']] },
      });
    }
  }

  // Ensure personnel sheet has status column header
  if (existingSheets.includes(PERSONNEL_SHEET)) {
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${PERSONNEL_SHEET}!C1`,
    });
    if (!headerResponse.data.values?.[0]?.[0]) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${PERSONNEL_SHEET}!C1`,
        valueInputOption: 'RAW',
        requestBody: { values: [['สถานะ']] },
      });
    }
  }
}
