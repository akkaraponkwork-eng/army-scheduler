"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivePersonnel = getActivePersonnel;
exports.generateSchedule = generateSchedule;
exports.formatScheduleText = formatScheduleText;
// ============================================================
// Army Duty Scheduler Algorithm
// ============================================================
var types_1 = require("./types");
/**
 * Get active personnel (excluding those exempt from duty)
 * on a given date
 */
function getActivePersonnel(personnel, exceptions, date) {
    // Filter out permanently exempt (assistant_sergeant)
    var active = personnel.filter(function (p) { return p.status === 'active'; });
    // Filter out temporary exceptions for this date
    return active.filter(function (p) {
        var ex = exceptions.find(function (e) {
            return e.personnelId === p.id &&
                e.startDate <= date &&
                e.endDate >= date;
        });
        return !ex;
    });
}
/**
 * Auto-generate duty schedule for a date range.
 * Rotates through personnel by ID, 6 people per shift (2 per position × 3 positions × 4 shifts = 24 per day).
 */
function generateSchedule(personnel, exceptions, punishments, startDate, endDate, startFromId) {
    if (startFromId === void 0) { startFromId = 1; }
    var assignments = [];
    var positions = types_1.DUTY_POSITIONS.map(function (p) { return p.key; });
    // Build sorted active personnel list
    var allPersonnel = __spreadArray([], personnel, true).sort(function (a, b) { return a.id - b.id; });
    // Track rotation pointer across all days
    // We'll use a different approach: track a global queue position
    var queuePointer = 0;
    // Calculate initial pointer position based on startFromId
    var activeForStart = getActivePersonnel(allPersonnel, exceptions, startDate);
    var startIdx = activeForStart.findIndex(function (p) { return p.id >= startFromId; });
    if (startIdx >= 0)
        queuePointer = startIdx;
    // Iterate through each day
    var current = new Date(startDate);
    var end = new Date(endDate);
    var _loop_1 = function () {
        var dateStr = formatDate(current);
        // Find all punished personnel for today across all shifts
        var punishedAllDay = punishments.filter(function (p) { return p.startDate <= dateStr && p.endDate >= dateStr; });
        var punishedIdsAllDay = punishedAllDay.map(function (p) { return p.personnelId; });
        // Get active personnel today, but EXCLUDE anyone who is punished today
        var activeToday = getActivePersonnel(allPersonnel, exceptions, dateStr);
        activeToday = activeToday.filter(function (p) { return !punishedIdsAllDay.includes(p.id); });
        var _loop_2 = function (shift) {
            var punishedTodayForShift = punishedAllDay.filter(function (p) { return p.shift === shift; });
            var punishedPersonnel = punishedTodayForShift.map(function (p) { return allPersonnel.find(function (x) { return x.id === p.personnelId; }); }).filter(Boolean);
            var assignedForThisShift = [];
            if (punishedPersonnel.length > 0) {
                // This is a punishment shift!
                // Only put punished personnel in this shift. No normal personnel.
                for (var _i = 0, punishedPersonnel_1 = punishedPersonnel; _i < punishedPersonnel_1.length; _i++) {
                    var p = punishedPersonnel_1[_i];
                    assignedForThisShift.push(p);
                }
            }
            else {
                // Normal shift: draw 6 from activeToday (if available)
                if (activeToday.length > 0) {
                    var attempts = 0;
                    var _loop_3 = function () {
                        var p = activeToday[queuePointer % activeToday.length];
                        queuePointer = (queuePointer + 1) % activeToday.length;
                        if (!assignedForThisShift.find(function (x) { return x.id === p.id; })) {
                            assignedForThisShift.push(p);
                        }
                        attempts++;
                    };
                    while (assignedForThisShift.length < 6 && attempts < activeToday.length * 2) {
                        _loop_3();
                    }
                }
            }
            // Distribute `assignedForThisShift` into the 3 positions
            var posCount = positions.length;
            var distribution = Array(posCount).fill(0).map(function () { return []; });
            for (var i = 0; i < assignedForThisShift.length; i++) {
                distribution[i % posCount].push(assignedForThisShift[i]);
            }
            for (var i = 0; i < posCount; i++) {
                assignments.push({
                    date: dateStr,
                    shift: shift,
                    position: positions[i],
                    personIds: distribution[i].map(function (p) { return p.id; }),
                });
            }
        };
        // For each shift (1-4)
        for (var shift = 1; shift <= 4; shift++) {
            _loop_2(shift);
        }
        current.setDate(current.getDate() + 1);
    };
    while (current <= end) {
        _loop_1();
    }
    return assignments;
}
function formatDate(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return "".concat(y, "-").concat(m, "-").concat(d);
}
/**
 * Format schedule as plain text for copy
 */
function formatScheduleText(date, assignments, personnel) {
    var SHIFT_TIMES = [
        { shift: 1, label: 'ผลัด 1', time: '21:00-23:00' },
        { shift: 2, label: 'ผลัด 2', time: '23:00-01:00' },
        { shift: 3, label: 'ผลัด 3', time: '01:00-03:00' },
        { shift: 4, label: 'ผลัด 4', time: '03:00-05:00' },
    ];
    var POSITION_LABELS = {
        north_armory: 'คลังอาวุธทิศเหนือ',
        central_porch: 'มุขกลาง',
        south_armory: 'คลังอาวุธทิศใต้',
    };
    var POSITION_ICONS = {
        north_armory: '🔴',
        central_porch: '🟡',
        south_armory: '🟢',
    };
    var personnelMap = new Map(personnel.map(function (p) { return [p.id, p]; }));
    // Format date in Thai format
    var dateObj = new Date(date);
    var thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    var thaiYear = dateObj.getFullYear() + 543;
    var thaiDate = "".concat(dateObj.getDate(), " ").concat(thaiMonths[dateObj.getMonth()], " ").concat(thaiYear);
    var text = "\uD83D\uDCC5 \u0E40\u0E27\u0E23\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ".concat(thaiDate, "\n");
    text += "".concat('─'.repeat(35), "\n\n");
    var _loop_4 = function (shiftInfo) {
        var shiftAssignments = assignments.filter(function (a) { return a.shift === shiftInfo.shift; });
        if (shiftAssignments.length === 0)
            return "continue";
        text += "\u23F0 ".concat(shiftInfo.label, " (").concat(shiftInfo.time, ")\n");
        var positions = ['north_armory', 'central_porch', 'south_armory'];
        var _loop_5 = function (pos) {
            var a = shiftAssignments.find(function (x) { return x.position === pos; });
            if (!a)
                return "continue";
            var pList = a.personIds.map(function (id) { return personnelMap.get(id); }).filter(Boolean);
            text += "  ".concat(POSITION_ICONS[pos], " ").concat(POSITION_LABELS[pos], "\n");
            if (pList.length === 0) {
                text += "     \u2022 -\n";
            }
            else {
                for (var _b = 0, pList_1 = pList; _b < pList_1.length; _b++) {
                    var p = pList_1[_b];
                    text += "     \u2022 ".concat(p.name, " (").concat(String(p.id).padStart(3, '0'), ")\n");
                }
            }
        };
        for (var _a = 0, positions_1 = positions; _a < positions_1.length; _a++) {
            var pos = positions_1[_a];
            _loop_5(pos);
        }
        text += '\n';
    };
    for (var _i = 0, SHIFT_TIMES_1 = SHIFT_TIMES; _i < SHIFT_TIMES_1.length; _i++) {
        var shiftInfo = SHIFT_TIMES_1[_i];
        _loop_4(shiftInfo);
    }
    return text.trimEnd();
}
