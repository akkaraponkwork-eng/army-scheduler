'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, ShieldAlert, Clock, CalendarDays, Activity } from 'lucide-react';
import { Personnel, DutyAssignment, ExceptionEntry, PunishmentEntry, DUTY_POSITIONS } from '@/lib/types';

export default function DashboardPage() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [scheduleData, setScheduleData] = useState<DutyAssignment[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionEntry[]>([]);
  const [punishments, setPunishments] = useState<PunishmentEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [perRes, excRes, punRes, schRes] = await Promise.all([
          fetch('/api/personnel'),
          fetch('/api/exceptions'),
          fetch('/api/punishments'),
          fetch(`/api/schedule?year=${year}&month=${month}`)
        ]);

        if (perRes.ok) setPersonnel(await perRes.json());
        if (excRes.ok) setExceptions(await excRes.json());
        if (punRes.ok) setPunishments(await punRes.json());
        if (schRes.ok) setScheduleData(await schRes.json());
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year, month]);

  const activeCount = personnel.filter(p => p.status === 'active').length;
  const exemptCount = personnel.filter(p => p.status === 'assistant_sergeant').length + exceptions.length;
  const personnelMap = new Map(personnel.map(p => [p.id, p]));

  const getDailyLastPersons = () => {
    const byDate: Record<string, DutyAssignment[]> = {};
    for (const a of scheduleData) {
      if (!byDate[a.date]) byDate[a.date] = [];
      byDate[a.date].push(a);
    }

    const positionOrder: Record<string, number> = { 'north_armory': 1, 'central_porch': 2, 'south_armory': 3 };

    const results = [];
    for (const [date, assignments] of Object.entries(byDate).sort()) {
      const maxShift = Math.max(...assignments.map(a => a.shift));
      const latestShiftAssignments = assignments.filter(a => a.shift === maxShift);
      latestShiftAssignments.sort((a, b) => positionOrder[a.position] - positionOrder[b.position]);

      const lastAssignment = latestShiftAssignments[latestShiftAssignments.length - 1];
      if (lastAssignment) {
        const lastId = lastAssignment.personIds?.[lastAssignment.personIds.length - 1];
        if (lastId) {
          results.push({
            date,
            shift: maxShift,
            position: lastAssignment.position,
            personnelId: lastId,
            personnelName: personnelMap.get(lastId)?.name || 'ไม่พบชื่อ'
          });
        }
      }
    }
    return results;
  };

  const dailyLastPersons = getDailyLastPersons();

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}`;
  };

  const formatMonthDay = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="header-brand">
          <Link href="/" className="btn btn-ghost btn-icon" style={{ marginLeft: '-8px' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="header-title" style={{ fontSize: '18px' }}>DASHBOARD</div>
            <div className="header-subtitle">สรุปข้อมูลการจัดเวร</div>
          </div>
        </div>
        <div className="header-actions">
          <select 
            className="edit-select" 
            style={{ width: 'auto', padding: '6px 32px 6px 10px', fontSize: '13px', minHeight: '36px' }}
            value={`${year}-${month}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-');
              setYear(parseInt(y));
              setMonth(parseInt(m));
            }}
          >
            {[...Array(12)].map((_, i) => {
              const d = new Date(year, today.getMonth() - 2 + i, 1);
              return (
                <option key={i} value={`${d.getFullYear()}-${d.getMonth() + 1}`}>
                  {d.toLocaleString('th-TH', { month: 'short' })} {d.getFullYear() + 543}
                </option>
              );
            })}
          </select>
        </div>
      </header>

      <main className="app-main" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-faint)' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 10px', width: '24px', height: '24px' }} />
            กำลังโหลดข้อมูล...
          </div>
        ) : (
          <>
            {/* ─── Summary Cards ─── */}
            <div className="dash-stats">
              <div className="dash-stat-card">
                <div className="dash-stat-icon" style={{ background: 'var(--primary-blue-glow)', color: 'var(--primary-blue-500)' }}>
                  <Users size={20} />
                </div>
                <div className="dash-stat-value">{personnel.length}</div>
                <div className="dash-stat-label">กำลังพลทั้งหมด</div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-icon" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                  <Activity size={20} />
                </div>
                <div className="dash-stat-value">{activeCount}</div>
                <div className="dash-stat-label">ใช้งานได้</div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-icon" style={{ background: 'var(--red-dim)', color: 'var(--red)' }}>
                  <ShieldAlert size={20} />
                </div>
                <div className="dash-stat-value">{exemptCount}</div>
                <div className="dash-stat-label">ยกเว้น / ป่วย</div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-icon" style={{ background: 'var(--orange-dim)', color: 'var(--orange)' }}>
                  <Clock size={20} />
                </div>
                <div className="dash-stat-value">{punishments.length}</div>
                <div className="dash-stat-label">ดองเวร</div>
              </div>
            </div>

            {/* ─── Last Person Table ─── */}
            <div className="dash-last-table">
              <div className="dash-last-header">
                <CalendarDays size={18} /> เลขสุดท้ายที่เข้าของ{THAI_MONTHS[month - 1]}
              </div>

              {dailyLastPersons.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-faint)', fontSize: '13px' }}>
                  ไม่มีข้อมูลตารางเวรในเดือนนี้
                </div>
              ) : (
                dailyLastPersons.map((item) => (
                  <div key={item.date} className="dash-last-item">
                    <div className="dash-last-date">{formatMonthDay(item.date)}</div>
                    <div className="dash-last-shift" style={{ background: `var(--shift${item.shift})` }}>
                      ผ.{item.shift}
                    </div>
                    <div className="dash-last-id">
                      {String(item.personnelId).padStart(3, '0')}
                    </div>
                    <div className="dash-last-name">{item.personnelName}</div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
