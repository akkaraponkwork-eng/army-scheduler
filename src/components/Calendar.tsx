'use client';
import React, { useMemo, useRef, useState, useCallback } from 'react';
import { DutyAssignment, Personnel } from '@/lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  year: number;
  month: number;
  scheduleData: DutyAssignment[];
  personnel: Personnel[];
  onDayClick: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const WEEKDAY_CLASSES = ['sun', '', '', '', '', '', 'sat'];
const DAY_CLASSES = ['sunday', '', '', '', '', '', 'saturday'];

export default function Calendar({
  year,
  month,
  scheduleData,
  personnel,
  onDayClick,
  onPrevMonth,
  onNextMonth,
}: CalendarProps) {
  const thaiYear = year + 543;
  const today = new Date();

  // Swipe support for mobile
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [swiping, setSwiping] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setSwiping(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    const diff = Math.abs(touchStartX.current - touchEndX.current);
    if (diff > 30) setSwiping(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!swiping) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 60) onNextMonth();
    else if (diff < -60) onPrevMonth();
    setSwiping(false);
  }, [swiping, onNextMonth, onPrevMonth]);

  // Build schedule map
  const scheduleMap = useMemo(() => {
    const map = new Map<string, DutyAssignment[]>();
    for (const a of scheduleData) {
      if (!map.has(a.date)) map.set(a.date, []);
      map.get(a.date)!.push(a);
    }
    return map;
  }, [scheduleData]);

  const personnelMap = useMemo(() => new Map(personnel.map((p) => [p.id, p])), [personnel]);

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const startDow = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  const cells: Array<{ date: Date; isCurrentMonth: boolean }> = [];

  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, -i), isCurrentMonth: false });
  }
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ date: new Date(year, month - 1, d), isCurrentMonth: true });
  }
  const remaining = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: false });
  }

  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const isToday = (d: Date) =>
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  const getPreview = (dateStr: string) => {
    const assignments = scheduleMap.get(dateStr) || [];
    const shiftMap = new Map<number, DutyAssignment>();
    for (const a of assignments) {
      if (!shiftMap.has(a.shift)) shiftMap.set(a.shift, a);
    }
    return Array.from(shiftMap.entries()).sort((a, b) => a[0] - b[0]);
  };

  // Count schedules for a date
  const getScheduleCount = (dateStr: string) => (scheduleMap.get(dateStr) || []).length;

  return (
    <div
      className="calendar-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="calendar-header">
        <button className="btn btn-secondary btn-icon" onClick={onPrevMonth} id="btn-prev-month" aria-label="เดือนก่อนหน้า" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={16} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div className="calendar-month-title">
            {THAI_MONTHS[month - 1]} {thaiYear}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '2px', fontWeight: '500', letterSpacing: '0.5px' }}>
            {year} CE — ปีที่ {thaiYear} พ.ศ.
          </div>
        </div>
        <button className="btn btn-secondary btn-icon" onClick={onNextMonth} id="btn-next-month" aria-label="เดือนถัดไป" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="calendar-weekdays">
        {WEEKDAYS.map((day, i) => (
          <div key={i} className={`calendar-weekday ${WEEKDAY_CLASSES[i]}`}>
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="calendar-grid">
        {cells.map((cell, idx) => {
          const dateStr = formatDate(cell.date);
          const dow = cell.date.getDay();
          const preview = cell.isCurrentMonth ? getPreview(dateStr) : [];
          const hasSchedule = preview.length > 0;
          const todayBool = isToday(cell.date);
          const scheduleCount = cell.isCurrentMonth ? getScheduleCount(dateStr) : 0;

          return (
            <div
              key={idx}
              className={[
                'calendar-day',
                !cell.isCurrentMonth && 'other-month',
                todayBool && 'today',
                hasSchedule && 'has-schedule',
                DAY_CLASSES[dow],
              ].filter(Boolean).join(' ')}
              onClick={() => {
                if (cell.isCurrentMonth && !swiping) onDayClick(dateStr);
              }}
              role="button"
              tabIndex={cell.isCurrentMonth ? 0 : -1}
              aria-label={cell.isCurrentMonth ? `ดูเวรวันที่ ${cell.date.getDate()} ${THAI_MONTHS[cell.date.getMonth()]}` : undefined}
            >
              <div className={`day-number ${todayBool ? 'today-dot' : ''}`}>
                {cell.date.getDate()}
              </div>

              {cell.isCurrentMonth && (
                <div className="day-preview">
                  {preview.slice(0, 4).map(([shift, a]) => {
                    const p1 = a.person1Id ? personnelMap.get(a.person1Id) : null;
                    const name = p1 ? p1.name.split(' ')[0].substring(0, 6) : '—';
                    return (
                      <div key={shift} className={`day-preview-item shift-${shift}`}>
                        {shift}: {name}
                      </div>
                    );
                  })}
                  {!hasSchedule && (
                    <div className="no-schedule-indicator">—</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--shift1)' }} />
          21:00
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--shift2)' }} />
          23:00
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--shift3)' }} />
          01:00
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--shift4)' }} />
          03:00
        </div>
        <div className="legend-item" style={{ marginLeft: 'auto' }}>
          <div className="legend-dot" style={{ background: 'var(--primary-blue-500)', borderRadius: 'var(--r-full)' }} />
          วันนี้
        </div>
      </div>
    </div>
  );
}
