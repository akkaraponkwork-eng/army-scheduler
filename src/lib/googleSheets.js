"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPersonnel = getPersonnel;
exports.updatePersonnelStatus = updatePersonnelStatus;
exports.getScheduleForMonth = getScheduleForMonth;
exports.getScheduleForDate = getScheduleForDate;
exports.saveSchedule = saveSchedule;
exports.getExceptions = getExceptions;
exports.saveException = saveException;
exports.removeException = removeException;
exports.getPunishments = getPunishments;
exports.savePunishments = savePunishments;
exports.removePunishment = removePunishment;
exports.ensureSheetsExist = ensureSheetsExist;
// ============================================================
// Google Sheets API Wrapper — Auto-detects Sheet1
// ============================================================
var googleapis_1 = require("googleapis");
var SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
var SCHEDULE_SHEET = 'schedule';
var EXCEPTIONS_SHEET = 'exceptions';
var PUNISHMENTS_SHEET = 'punishments';
var CACHE_TTL = 30000;
var cache = {
    personnel: null,
    schedule: new Map(),
    exceptions: null,
    punishments: null,
};
function isCacheValid(timestamp) {
    return Date.now() - timestamp < CACHE_TTL;
}
// ------------------------------------------
function getAuth() {
    var credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    var auth = new googleapis_1.google.auth.GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return auth;
}
function getSheetsClient() {
    return __awaiter(this, void 0, void 0, function () {
        var auth;
        return __generator(this, function (_a) {
            auth = getAuth();
            return [2 /*return*/, googleapis_1.google.sheets({ version: 'v4', auth: auth })];
        });
    });
}
/**
 * Finds the first sheet in the spreadsheet (Sheet1) to use as personnel data.
 * Falls back to 'Sheet1' or 'personnel' if auto-detect fails.
 */
function getFirstSheetName() {
    return __awaiter(this, void 0, void 0, function () {
        var sheets, spreadsheet, allSheets, managedNames, dataSheets;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, getSheetsClient()];
                case 1:
                    sheets = _b.sent();
                    return [4 /*yield*/, sheets.spreadsheets.get({
                            spreadsheetId: SPREADSHEET_ID,
                            fields: 'sheets.properties.title,sheets.properties.index',
                        })];
                case 2:
                    spreadsheet = _b.sent();
                    allSheets = spreadsheet.data.sheets || [];
                    managedNames = [SCHEDULE_SHEET, EXCEPTIONS_SHEET, PUNISHMENTS_SHEET];
                    dataSheets = allSheets
                        .filter(function (s) { var _a; return !managedNames.includes(((_a = s.properties) === null || _a === void 0 ? void 0 : _a.title) || ''); })
                        .sort(function (a, b) { var _a, _b; return (((_a = a.properties) === null || _a === void 0 ? void 0 : _a.index) || 0) - (((_b = b.properties) === null || _b === void 0 ? void 0 : _b.index) || 0); });
                    if (dataSheets.length > 0) {
                        return [2 /*return*/, ((_a = dataSheets[0].properties) === null || _a === void 0 ? void 0 : _a.title) || 'Sheet1'];
                    }
                    return [2 /*return*/, 'Sheet1'];
            }
        });
    });
}
// Cache the first sheet name to avoid repeated API calls
var cachedFirstSheet = null;
function getPersonnelSheet() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!cachedFirstSheet) return [3 /*break*/, 2];
                    return [4 /*yield*/, getFirstSheetName()];
                case 1:
                    cachedFirstSheet = _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/, cachedFirstSheet];
            }
        });
    });
}
// ============================================================
// Personnel Functions
// ============================================================
function getPersonnel() {
    return __awaiter(this, void 0, void 0, function () {
        var sheets, sheetName, response, rows, personnel;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (cache.personnel && isCacheValid(cache.personnel.timestamp)) {
                        return [2 /*return*/, cache.personnel.data];
                    }
                    return [4 /*yield*/, getSheetsClient()];
                case 1:
                    sheets = _a.sent();
                    return [4 /*yield*/, getPersonnelSheet()];
                case 2:
                    sheetName = _a.sent();
                    return [4 /*yield*/, sheets.spreadsheets.values.get({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "'".concat(sheetName, "'!A2:H200"),
                        })];
                case 3:
                    response = _a.sent();
                    rows = response.data.values || [];
                    personnel = rows
                        .filter(function (row) {
                        var idCol = row.findIndex(function (val) { return val && !isNaN(parseInt(val)); });
                        return idCol !== -1;
                    })
                        .map(function (row) {
                        var idCol = row.findIndex(function (val) { return val && !isNaN(parseInt(val)); });
                        var id = parseInt(row[idCol]);
                        var rank = (row[idCol + 1] || '').trim();
                        var firstName = (row[idCol + 2] || '').trim();
                        var lastName = (row[idCol + 3] || '').trim();
                        var remark = (row[idCol + 5] || '').trim();
                        var fullName = [rank, firstName, lastName].filter(Boolean).join(' ');
                        var status = 'active';
                        if (remark.includes('ผู้ช่วยนายสิบ') || remark.includes('ผช.นสบ'))
                            status = 'assistant_sergeant';
                        else if (remark.includes('ป่วย'))
                            status = 'sick';
                        else if (remark.includes('ธุระการ') || remark.includes('ลา'))
                            status = 'admin_duty';
                        return {
                            id: id,
                            name: fullName,
                            status: status,
                        };
                    });
                    cache.personnel = { data: personnel, timestamp: Date.now() };
                    return [2 /*return*/, personnel];
            }
        });
    });
}
function updatePersonnelStatus(id, status) {
    return __awaiter(this, void 0, void 0, function () {
        var sheets, sheetName, personnel, rowIndex, rowNumber;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getSheetsClient()];
                case 1:
                    sheets = _a.sent();
                    return [4 /*yield*/, getPersonnelSheet()];
                case 2:
                    sheetName = _a.sent();
                    return [4 /*yield*/, getPersonnel()];
                case 3:
                    personnel = _a.sent();
                    rowIndex = personnel.findIndex(function (p) { return p.id === id; });
                    if (rowIndex === -1)
                        throw new Error("Personnel ID ".concat(id, " not found"));
                    rowNumber = rowIndex + 2;
                    return [4 /*yield*/, sheets.spreadsheets.values.update({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "'".concat(sheetName, "'!F").concat(rowNumber),
                            valueInputOption: 'RAW',
                            requestBody: { values: [[status]] },
                        })];
                case 4:
                    _a.sent();
                    // Invalidate cache
                    cache.personnel = null;
                    return [2 /*return*/];
            }
        });
    });
}
// ============================================================
// Schedule Functions
// ============================================================
function getScheduleForMonth(year, month) {
    return __awaiter(this, void 0, void 0, function () {
        var cacheKey, cached, sheets, response, rows, prefix_1, schedule, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    cacheKey = "".concat(year, "-").concat(month);
                    cached = cache.schedule.get(cacheKey);
                    if (cached && isCacheValid(cached.timestamp)) {
                        return [2 /*return*/, cached.data];
                    }
                    return [4 /*yield*/, getSheetsClient()];
                case 1:
                    sheets = _b.sent();
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, sheets.spreadsheets.values.get({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "'".concat(SCHEDULE_SHEET, "'!A2:E5000"),
                        })];
                case 3:
                    response = _b.sent();
                    rows = response.data.values || [];
                    prefix_1 = "".concat(year, "-").concat(String(month).padStart(2, '0'));
                    schedule = rows
                        .filter(function (row) { var _a; return (_a = row[0]) === null || _a === void 0 ? void 0 : _a.startsWith(prefix_1); })
                        .map(function (row) { return ({
                        date: row[0],
                        shift: parseInt(row[1]),
                        position: row[2],
                        personIds: row[3] && String(row[3]).includes(',')
                            ? String(row[3]).split(',').map(function (id) { return parseInt(id.trim()); }).filter(function (id) { return !isNaN(id); })
                            : [row[3] ? parseInt(row[3]) : null, row[4] ? parseInt(row[4]) : null].filter(function (id) { return id !== null && !isNaN(id); }),
                    }); });
                    cache.schedule.set(cacheKey, { data: schedule, timestamp: Date.now() });
                    return [2 /*return*/, schedule];
                case 4:
                    _a = _b.sent();
                    return [2 /*return*/, []];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function getScheduleForDate(date) {
    return __awaiter(this, void 0, void 0, function () {
        var sheets, response, rows, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, getSheetsClient()];
                case 1:
                    sheets = _b.sent();
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, sheets.spreadsheets.values.get({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "'".concat(SCHEDULE_SHEET, "'!A2:E5000"),
                        })];
                case 3:
                    response = _b.sent();
                    rows = response.data.values || [];
                    return [2 /*return*/, rows
                            .filter(function (row) { return row[0] === date; })
                            .map(function (row) { return ({
                            date: row[0],
                            shift: parseInt(row[1]),
                            position: row[2],
                            personIds: row[3] && String(row[3]).includes(',')
                                ? String(row[3]).split(',').map(function (id) { return parseInt(id.trim()); }).filter(function (id) { return !isNaN(id); })
                                : [row[3] ? parseInt(row[3]) : null, row[4] ? parseInt(row[4]) : null].filter(function (id) { return id !== null && !isNaN(id); }),
                        }); })];
                case 4:
                    _a = _b.sent();
                    return [2 /*return*/, []];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function saveSchedule(assignments) {
    return __awaiter(this, void 0, void 0, function () {
        var sheets, existingRows, response, _a, existingMap, updates, newRows, _i, assignments_1, assignment, key, rowValue, rowNum;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, getSheetsClient()];
                case 1:
                    sheets = _b.sent();
                    // Ensure sheets exist before saving
                    return [4 /*yield*/, ensureSheetsExist()];
                case 2:
                    // Ensure sheets exist before saving
                    _b.sent();
                    existingRows = [];
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, sheets.spreadsheets.values.get({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "'".concat(SCHEDULE_SHEET, "'!A2:E5000"),
                        })];
                case 4:
                    response = _b.sent();
                    existingRows = response.data.values || [];
                    return [3 /*break*/, 6];
                case 5:
                    _a = _b.sent();
                    return [3 /*break*/, 6];
                case 6:
                    existingMap = new Map();
                    existingRows.forEach(function (row, index) {
                        var key = "".concat(row[0], "_").concat(row[1], "_").concat(row[2]);
                        existingMap.set(key, index + 2);
                    });
                    updates = [];
                    newRows = [];
                    for (_i = 0, assignments_1 = assignments; _i < assignments_1.length; _i++) {
                        assignment = assignments_1[_i];
                        key = "".concat(assignment.date, "_").concat(assignment.shift, "_").concat(assignment.position);
                        rowValue = [
                            assignment.date,
                            String(assignment.shift),
                            assignment.position,
                            assignment.personIds.join(', '),
                            '',
                        ];
                        if (existingMap.has(key)) {
                            rowNum = existingMap.get(key);
                            updates.push({
                                range: "'".concat(SCHEDULE_SHEET, "'!A").concat(rowNum, ":E").concat(rowNum),
                                values: [rowValue],
                            });
                        }
                        else {
                            newRows.push(rowValue);
                        }
                    }
                    if (!(updates.length > 0)) return [3 /*break*/, 8];
                    return [4 /*yield*/, sheets.spreadsheets.values.batchUpdate({
                            spreadsheetId: SPREADSHEET_ID,
                            requestBody: {
                                valueInputOption: 'RAW',
                                data: updates,
                            },
                        })];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8:
                    if (!(newRows.length > 0)) return [3 /*break*/, 10];
                    return [4 /*yield*/, sheets.spreadsheets.values.append({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "'".concat(SCHEDULE_SHEET, "'!A:E"),
                            valueInputOption: 'RAW',
                            requestBody: { values: newRows },
                        })];
                case 9:
                    _b.sent();
                    _b.label = 10;
                case 10:
                    // Invalidate all schedule caches since any month could be affected
                    cache.schedule.clear();
                    return [2 /*return*/];
            }
        });
    });
}
// ============================================================
// Exceptions Functions
// ============================================================
function getExceptions() {
    return __awaiter(this, void 0, void 0, function () {
        var sheets, response, rows, exceptions, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (cache.exceptions && isCacheValid(cache.exceptions.timestamp)) {
                        return [2 /*return*/, cache.exceptions.data];
                    }
                    return [4 /*yield*/, getSheetsClient()];
                case 1:
                    sheets = _b.sent();
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, sheets.spreadsheets.values.get({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "'".concat(EXCEPTIONS_SHEET, "'!A2:D500"),
                        })];
                case 3:
                    response = _b.sent();
                    rows = response.data.values || [];
                    exceptions = rows
                        .filter(function (row) { return row[0]; })
                        .map(function (row) { return ({
                        personnelId: parseInt(row[0]),
                        reason: row[1],
                        startDate: row[2],
                        endDate: row[3],
                    }); });
                    cache.exceptions = { data: exceptions, timestamp: Date.now() };
                    return [2 /*return*/, exceptions];
                case 4:
                    _a = _b.sent();
                    return [2 /*return*/, []];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function saveException(entry) {
    return __awaiter(this, void 0, void 0, function () {
        var sheets;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getSheetsClient()];
                case 1:
                    sheets = _a.sent();
                    return [4 /*yield*/, ensureSheetsExist()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, sheets.spreadsheets.values.append({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "'".concat(EXCEPTIONS_SHEET, "'!A:D"),
                            valueInputOption: 'RAW',
                            requestBody: {
                                values: [[
                                        String(entry.personnelId),
                                        entry.reason,
                                        entry.startDate,
                                        entry.endDate,
                                    ]],
                            },
                        })];
                case 3:
                    _a.sent();
                    cache.exceptions = null;
                    return [2 /*return*/];
            }
        });
    });
}
function removeException(personnelId, startDate) {
    return __awaiter(this, void 0, void 0, function () {
        var sheets, response, rows, rowIndex, rowNum, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, getSheetsClient()];
                case 1:
                    sheets = _b.sent();
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 6, , 7]);
                    return [4 /*yield*/, sheets.spreadsheets.values.get({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "'".concat(EXCEPTIONS_SHEET, "'!A2:D500"),
                        })];
                case 3:
                    response = _b.sent();
                    rows = response.data.values || [];
                    rowIndex = rows.findIndex(function (row) { return parseInt(row[0]) === personnelId && row[2] === startDate; });
                    if (!(rowIndex !== -1)) return [3 /*break*/, 5];
                    rowNum = rowIndex + 2;
                    return [4 /*yield*/, sheets.spreadsheets.values.clear({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "'".concat(EXCEPTIONS_SHEET, "'!A").concat(rowNum, ":D").concat(rowNum),
                        })];
                case 4:
                    _b.sent();
                    cache.exceptions = null;
                    _b.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    _a = _b.sent();
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// ============================================================
// Punishments Functions
// ============================================================
function getPunishments() {
    return __awaiter(this, void 0, void 0, function () {
        var sheets, response, rows, punishments, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (cache.punishments && isCacheValid(cache.punishments.timestamp)) {
                        return [2 /*return*/, cache.punishments.data];
                    }
                    return [4 /*yield*/, getSheetsClient()];
                case 1:
                    sheets = _b.sent();
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, sheets.spreadsheets.values.get({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "'".concat(PUNISHMENTS_SHEET, "'!A2:D500"),
                        })];
                case 3:
                    response = _b.sent();
                    rows = response.data.values || [];
                    punishments = rows
                        .filter(function (row) { return row[0]; })
                        .map(function (row) { return ({
                        personnelId: parseInt(row[0]),
                        shift: parseInt(row[1]),
                        startDate: row[2],
                        endDate: row[3],
                    }); });
                    cache.punishments = { data: punishments, timestamp: Date.now() };
                    return [2 /*return*/, punishments];
                case 4:
                    _a = _b.sent();
                    return [2 /*return*/, []];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function savePunishments(entries) {
    return __awaiter(this, void 0, void 0, function () {
        var sheets, values;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getSheetsClient()];
                case 1:
                    sheets = _a.sent();
                    return [4 /*yield*/, ensureSheetsExist()];
                case 2:
                    _a.sent();
                    values = entries.map(function (entry) { return [
                        String(entry.personnelId),
                        String(entry.shift),
                        entry.startDate,
                        entry.endDate,
                    ]; });
                    return [4 /*yield*/, sheets.spreadsheets.values.append({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "'".concat(PUNISHMENTS_SHEET, "'!A:D"),
                            valueInputOption: 'RAW',
                            requestBody: { values: values },
                        })];
                case 3:
                    _a.sent();
                    cache.punishments = null;
                    return [2 /*return*/];
            }
        });
    });
}
function removePunishment(personnelId, startDate) {
    return __awaiter(this, void 0, void 0, function () {
        var sheets, response, rows, rowIndex, rowNum, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, getSheetsClient()];
                case 1:
                    sheets = _b.sent();
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 6, , 7]);
                    return [4 /*yield*/, sheets.spreadsheets.values.get({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "'".concat(PUNISHMENTS_SHEET, "'!A2:D500"),
                        })];
                case 3:
                    response = _b.sent();
                    rows = response.data.values || [];
                    rowIndex = rows.findIndex(function (row) { return parseInt(row[0]) === personnelId && row[2] === startDate; });
                    if (!(rowIndex !== -1)) return [3 /*break*/, 5];
                    rowNum = rowIndex + 2;
                    return [4 /*yield*/, sheets.spreadsheets.values.clear({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "'".concat(PUNISHMENTS_SHEET, "'!A").concat(rowNum, ":D").concat(rowNum),
                        })];
                case 4:
                    _b.sent();
                    cache.punishments = null;
                    _b.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    _a = _b.sent();
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// ============================================================
// Ensure required sheets exist — auto-creates them
// ============================================================
var sheetsInitialized = false;
function ensureSheetsExist() {
    return __awaiter(this, void 0, void 0, function () {
        var sheets, spreadsheet, existingSheets, requests, headerUpdates, personnelSheet, headerResponse, _a;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (sheetsInitialized)
                        return [2 /*return*/];
                    return [4 /*yield*/, getSheetsClient()];
                case 1:
                    sheets = _e.sent();
                    return [4 /*yield*/, sheets.spreadsheets.get({
                            spreadsheetId: SPREADSHEET_ID,
                            fields: 'sheets.properties.title',
                        })];
                case 2:
                    spreadsheet = _e.sent();
                    existingSheets = ((_b = spreadsheet.data.sheets) === null || _b === void 0 ? void 0 : _b.map(function (s) { var _a; return (_a = s.properties) === null || _a === void 0 ? void 0 : _a.title; })) || [];
                    requests = [];
                    if (!existingSheets.includes(SCHEDULE_SHEET)) {
                        requests.push({ addSheet: { properties: { title: SCHEDULE_SHEET } } });
                    }
                    if (!existingSheets.includes(EXCEPTIONS_SHEET)) {
                        requests.push({ addSheet: { properties: { title: EXCEPTIONS_SHEET } } });
                    }
                    if (!existingSheets.includes(PUNISHMENTS_SHEET)) {
                        requests.push({ addSheet: { properties: { title: PUNISHMENTS_SHEET } } });
                    }
                    if (!(requests.length > 0)) return [3 /*break*/, 5];
                    return [4 /*yield*/, sheets.spreadsheets.batchUpdate({
                            spreadsheetId: SPREADSHEET_ID,
                            requestBody: { requests: requests },
                        })];
                case 3:
                    _e.sent();
                    headerUpdates = [];
                    if (!existingSheets.includes(SCHEDULE_SHEET)) {
                        headerUpdates.push(sheets.spreadsheets.values.update({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "'".concat(SCHEDULE_SHEET, "'!A1:E1"),
                            valueInputOption: 'RAW',
                            requestBody: { values: [['วันที่', 'ผลัด', 'ตำแหน่ง', 'รายชื่อรหัส (คั่นด้วยคอมมา)']] },
                        }));
                    }
                    if (!existingSheets.includes(EXCEPTIONS_SHEET)) {
                        headerUpdates.push(sheets.spreadsheets.values.update({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "'".concat(EXCEPTIONS_SHEET, "'!A1:D1"),
                            valueInputOption: 'RAW',
                            requestBody: { values: [['รหัส', 'เหตุผล', 'วันที่เริ่ม', 'วันที่สิ้นสุด']] },
                        }));
                    }
                    if (!existingSheets.includes(PUNISHMENTS_SHEET)) {
                        headerUpdates.push(sheets.spreadsheets.values.update({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "'".concat(PUNISHMENTS_SHEET, "'!A1:D1"),
                            valueInputOption: 'RAW',
                            requestBody: { values: [['รหัส', 'ผลัด', 'วันที่เริ่ม', 'วันที่สิ้นสุด']] },
                        }));
                    }
                    return [4 /*yield*/, Promise.all(headerUpdates)];
                case 4:
                    _e.sent();
                    _e.label = 5;
                case 5: return [4 /*yield*/, getPersonnelSheet()];
                case 6:
                    personnelSheet = _e.sent();
                    if (!existingSheets.includes(personnelSheet)) return [3 /*break*/, 12];
                    _e.label = 7;
                case 7:
                    _e.trys.push([7, 11, , 12]);
                    return [4 /*yield*/, sheets.spreadsheets.values.get({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "'".concat(personnelSheet, "'!A1:F1"),
                        })];
                case 8:
                    headerResponse = _e.sent();
                    if (!!((_d = (_c = headerResponse.data.values) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d[0])) return [3 /*break*/, 10];
                    return [4 /*yield*/, sheets.spreadsheets.values.update({
                            spreadsheetId: SPREADSHEET_ID,
                            range: "'".concat(personnelSheet, "'!A1:F1"),
                            valueInputOption: 'RAW',
                            requestBody: { values: [['รหัส', 'ยศ', 'ชื่อ', 'สกุล', 'หน่วย', 'หมายเหตุ']] },
                        })];
                case 9:
                    _e.sent();
                    _e.label = 10;
                case 10: return [3 /*break*/, 12];
                case 11:
                    _a = _e.sent();
                    return [3 /*break*/, 12];
                case 12:
                    sheetsInitialized = true;
                    return [2 /*return*/];
            }
        });
    });
}
