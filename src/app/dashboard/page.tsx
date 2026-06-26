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

  // Derived Summary
  const activeCount = personnel.filter(p => p.status === 'active').length;
  const exemptCount = personnel.filter(p => p.status === 'assistant_sergeant').length + exceptions.length;

  const personnelMap = new Map(personnel.map(p => [p.id, p]));

  // Find last person of each day
  const getDailyLastPersons = () => {
    // Group schedule by date
    const byDate: Record<string, DutyAssignment[]> = {};
    for (const a of scheduleData) {
      if (!byDate[a.date]) byDate[a.date] = [];
      byDate[a.date].push(a);
    }

    const positionOrder = { 'north_armory': 1, 'central_porch': 2, 'south_armory': 3 };

    const results = [];
    for (const [date, assignments] of Object.entries(byDate).sort()) {
      // Find the latest shift
      const maxShift = Math.max(...assignments.map(a => a.shift));
      const latestShiftAssignments = assignments.filter(a => a.shift === maxShift);

      // Sort by position order (highest last)
      latestShiftAssignments.sort((a, b) => positionOrder[a.position] - positionOrder[b.position]);

      const lastAssignment = latestShiftAssignments[latestShiftAssignments.length - 1];
      if (lastAssignment) {
        const lastId = lastAssignment.person2Id || lastAssignment.person1Id;
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

  const formatDateThai = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear() + 543}`;
  };

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
            style={{ width: '120px', padding: '6px 12px', fontSize: '13px' }}
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

      <main className="app-main" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-faint)' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 10px', width: '24px', height: '24px' }} />
            กำลังโหลดข้อมูล...
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="shift-section" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--primary-blue-glow)', padding: '12px', borderRadius: 'var(--r-md)', color: 'var(--primary-blue-500)' }}>
                  <Users size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>กำลังพลทั้งหมด</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{personnel.length}</div>
                </div>
              </div>

              <div className="shift-section" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(52, 211, 153, 0.12)', padding: '12px', borderRadius: 'var(--r-md)', color: '#34d399' }}>
                  <Activity size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>ใช้งานได้ (Active)</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{activeCount}</div>
                </div>
              </div>

              <div className="shift-section" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--red-dim)', padding: '12px', borderRadius: 'var(--r-md)', color: 'var(--red)' }}>
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>ยกเว้น / ป่วย</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{exemptCount}</div>
                </div>
              </div>

              <div className="shift-section" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--orange-dim)', padding: '12px', borderRadius: 'var(--r-md)', color: 'var(--orange)' }}>
                  <Clock size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>ดองเวร</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{punishments.length}</div>
                </div>
              </div>
            </div>

            <div className="shift-section" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 700, color: 'var(--primary-blue-500)', fontSize: '15px' }}>
                <CalendarDays size={18} /> เลขสุดท้ายที่เข้าของวันนั้นๆ
              </div>
              
              {dailyLastPersons.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-faint)', fontSize: '13px' }}>
                  ไม่มีข้อมูลตารางเวรในเดือนนี้
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>วันที่</th>
                        <th style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>ผลัดสุดท้าย</th>
                        <th style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>รหัส</th>
                        <th style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>ชื่อทหาร</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyLastPersons.map((item, idx) => {
                        const positionInfo = DUTY_POSITIONS.find(p => p.key === item.position);
                        return (
                          <tr key={item.date} style={{ borderBottom: '1px solid var(--border-subtle)', background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)' }}>
                            <td style={{ padding: '12px 8px', fontWeight: 600 }}>{formatDateThai(item.date)}</td>
                            <td style={{ padding: '12px 8px' }}>
                              <span className={`badge`} style={{ background: `var(--shift${item.shift})`, color: '#fff', padding: '3px 8px' }}>
                                ผลัด {item.shift}
                              </span>
                              <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--text-faint)' }}>{positionInfo?.label}</span>
                            </td>
                            <td style={{ padding: '12px 8px', fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, color: 'var(--primary-blue-500)' }}>
                              {String(item.personnelId).padStart(3, '0')}
                            </td>
                            <td style={{ padding: '12px 8px' }}>{item.personnelName}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
