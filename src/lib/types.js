"use strict";
// ============================================================
// Types for Army Duty Scheduler
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHIFT_TIMES = exports.DUTY_POSITIONS = void 0;
exports.DUTY_POSITIONS = [
    { key: 'north_armory', label: 'หน้าคลังอาวุธทิศเหนือ', icon: '🔴' },
    { key: 'central_porch', label: 'หน้ามุขกลาง', icon: '🟡' },
    { key: 'south_armory', label: 'หน้าคลังอาวุธทิศใต้', icon: '🟢' },
];
exports.SHIFT_TIMES = [
    { shift: 1, label: 'ผลัด 1', start: '21:00', end: '23:00' },
    { shift: 2, label: 'ผลัด 2', start: '23:00', end: '01:00' },
    { shift: 3, label: 'ผลัด 3', start: '01:00', end: '03:00' },
    { shift: 4, label: 'ผลัด 4', start: '03:00', end: '05:00' },
];
