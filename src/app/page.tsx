'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Check, Copy, Zap, ShieldAlert, CalendarIcon, Gavel, Activity } from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import Calendar from '@/components/Calendar';
import DayDetailModal from '@/components/DayDetailModal';
import EditShiftModal from '@/components/EditShiftModal';
import GenerateModal from '@/components/GenerateModal';
import QuickGenerateModal from '@/components/QuickGenerateModal';
import ExceptionManager from '@/components/ExceptionManager';
import PunishmentManager from '@/components/PunishmentManager';
import { Personnel, DutyAssignment, ExceptionEntry, PunishmentEntry } from '@/lib/types';
import { formatScheduleText } from '@/lib/scheduler';

interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: React.ReactNode;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

export default function HomePage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [scheduleData, setScheduleData] = useState<DutyAssignment[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionEntry[]>([]);
  const [punishments, setPunishments] = useState<PunishmentEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<DutyAssignment | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showQuickGenerate, setShowQuickGenerate] = useState(false);
  const [showExceptions, setShowExceptions] = useState(false);
  const [showPunishments, setShowPunishments] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  // PWA Install
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Restore state from cookies and localstorage
  useEffect(() => {
    const savedYear = Cookies.get('last_year');
    const savedMonth = Cookies.get('last_month');
    if (savedYear) setYear(parseInt(savedYear));
    if (savedMonth) setMonth(parseInt(savedMonth));

    // Restore personnel from localStorage for instant loading
    try {
      const cachedPersonnel = localStorage.getItem('personnel');
      if (cachedPersonnel) {
        const parsed = JSON.parse(cachedPersonnel);
        if (Array.isArray(parsed)) {
          setPersonnel(parsed);
        }
      }
    } catch {
      // Ignore parse error
    }
  }, []);

  // Save state to cookies
  useEffect(() => {
    Cookies.set('last_year', String(year));
    Cookies.set('last_month', String(month));
  }, [year, month]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show install banner after 3 seconds
      setTimeout(() => setShowInstallBanner(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('success', <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} /> ติดตั้งแอปสำเร็จ</span>);
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  // ─── Toast helpers ───
  const showToast = useCallback((type: Toast['type'], message: React.ReactNode) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  // ─── Load data ───
  const loadPersonnel = useCallback(async () => {
    try {
      const res = await fetch('/api/personnel');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPersonnel(data);
        localStorage.setItem('personnel', JSON.stringify(data));
      } else {
        throw new Error('Invalid data format');
      }
    } catch {
      showToast('error', 'ไม่สามารถโหลดรายชื่อได้ — ตรวจสอบการตั้งค่า');
    }
  }, [showToast]);

  const loadSchedule = useCallback(async (y: number, m: number) => {
    setLoadingSchedule(true);
    try {
      const res = await fetch(`/api/schedule?year=${y}&month=${m}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (Array.isArray(data)) {
        setScheduleData(data);
      }
    } catch {
      showToast('error', 'ไม่สามารถโหลดตารางเวรได้');
    } finally {
      setLoadingSchedule(false);
    }
  }, [showToast]);

  const loadExceptions = useCallback(async () => {
    try {
      const res = await fetch('/api/exceptions');
      if (!res.ok) throw new Error('Failed');
      setExceptions(await res.json());
    } catch {
      // Exceptions sheet may not exist yet
    }
  }, []);

  const loadPunishments = useCallback(async () => {
    try {
      const res = await fetch('/api/punishments');
      if (!res.ok) throw new Error('Failed');
      setPunishments(await res.json());
    } catch {
      // Punishments sheet may not exist yet
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadPersonnel(), loadExceptions(), loadPunishments()]);
      setLoading(false);
    };
    init();
  }, [loadPersonnel, loadExceptions, loadPunishments]);

  useEffect(() => {
    loadSchedule(year, month);
  }, [year, month, loadSchedule]);

  // ─── Navigation ───
  const handlePrevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };

  const handleNextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  // ─── Day detail ───
  const selectedDayAssignments = selectedDate
    ? scheduleData.filter((a) => a.date === selectedDate)
    : [];

  // ─── Copy ───
  const handleCopy = useCallback(() => {
    if (!selectedDate) return;
    const text = formatScheduleText(selectedDate, selectedDayAssignments, personnel);
    navigator.clipboard.writeText(text).then(() => {
      showToast('success', <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Copy size={14} /> คัดลอกสำเร็จ</span>);
    }).catch(() => {
      // Fallback for mobile
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('success', <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Copy size={14} /> คัดลอกสำเร็จ</span>);
    });
  }, [selectedDate, selectedDayAssignments, personnel, showToast]);

  // ─── Edit ───
  const handleSaveEdit = async (updated: DutyAssignment) => {
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([updated]),
      });
      if (!res.ok) throw new Error('Failed');

      setScheduleData((prev) =>
        prev.map((a) =>
          a.date === updated.date && a.shift === updated.shift && a.position === updated.position
            ? updated
            : a
        )
      );
      showToast('success', <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} /> บันทึกเรียบร้อย</span>);
    } catch {
      showToast('error', 'ไม่สามารถบันทึกได้');
    }
  };

  // ─── Generate ───
  const handleGenerate = async (startDate: string, endDate: string, startFromId: number, assistantSergeants?: number[]) => {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, endDate, startFromId, assistantSergeants }),
    });
    if (!res.ok) throw new Error('Failed');
    const result = await res.json();
    showToast('success', <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={14} /> สร้างเวร {result.count} รายการสำเร็จ</span>);
    await loadSchedule(year, month);
  };

  const getDefaultStartId = useCallback((dateStr: string) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - 1);
    const prevDate = d.toISOString().split('T')[0];
    
    const prevAssignments = scheduleData.filter(a => a.date === prevDate);
    if (prevAssignments.length > 0) {
      const shift4 = prevAssignments.filter(a => a.shift === 4);
      const lastA = shift4.length > 0 ? shift4[shift4.length - 1] : prevAssignments[prevAssignments.length - 1];
      if (lastA && lastA.personIds && lastA.personIds.length > 0) {
        let lastId = lastA.personIds[lastA.personIds.length - 1];
        let next = lastId + 1;
        if (next > 125) next = 1; // Assuming max 125, but actually should just return next. The user can edit it.
        return next;
      }
    }
    return 1;
  }, [scheduleData]);

  // ─── Exceptions ───
  const handleAddException = async (entry: ExceptionEntry) => {
    const res = await fetch('/api/exceptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error('Failed');
    setExceptions((prev) => [...prev, entry]);
    showToast('success', 'เพิ่มรายการยกเว้นสำเร็จ');
  };

  const handleRemoveException = async (personnelId: number, startDate: string) => {
    const res = await fetch('/api/exceptions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personnelId, startDate }),
    });
    if (!res.ok) throw new Error('Failed');
    setExceptions((prev) => prev.filter((e) => !(e.personnelId === personnelId && e.startDate === startDate)));
    showToast('info', 'ลบรายการยกเว้นแล้ว');
  };

  const handleAddPunishments = async (entries: PunishmentEntry[]) => {
    const res = await fetch('/api/punishments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entries),
    });
    if (!res.ok) throw new Error('Failed');
    setPunishments((prev) => [...prev, ...entries]);
    showToast('success', 'บันทึกรายการดองเวรสำเร็จ');
  };

  const handleRemovePunishment = async (personnelId: number, startDate: string) => {
    const res = await fetch('/api/punishments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personnelId, startDate }),
    });
    if (!res.ok) throw new Error('Failed');
    setPunishments((prev) => prev.filter((e) => !(e.personnelId === personnelId && e.startDate === startDate)));
    showToast('info', 'ลบรายการดองเวรแล้ว');
  };

  const activeCount = personnel.filter((p) => p.status === 'active').length;
  const exemptCount = personnel.filter((p) => p.status === 'assistant_sergeant').length + exceptions.length;

  return (
    <div className="app-wrapper">
      {/* ─── Header ─── */}
      <header className="app-header">
        <div className="header-brand">
          <div className="header-emblem"><Shield size={20} color="var(--bg-void)" /></div>
          <div>
            <div className="header-title">ARMY DUTY</div>
            <div className="header-subtitle">ระบบจัดตารางเวรทหาร</div>
          </div>
        </div>
        <div className="header-actions">
          {loading ? (
            <div className="status-bar">
              <span className="loading-spinner" />
              <span>กำลังโหลด</span>
            </div>
          ) : (
            <div className="status-bar">
              <span className="status-dot" />
              <span>{activeCount} นาย · ยกเว้น {exemptCount}</span>
            </div>
          )}
        </div>
      </header>

      {/* ─── Main ─── */}
      <main className="app-main">
        {/* Toolbar (Desktop only — hidden on mobile via CSS) */}
        <div className="toolbar">
          <Link href="/dashboard" className="btn btn-secondary" id="btn-open-dashboard">
            <Activity size={16} /> แดชบอร์ด
          </Link>
          <button
            className="btn btn-primary"
            onClick={() => setShowGenerate(true)}
            disabled={loading || personnel.length === 0}
            id="btn-open-generate"
          >
            <Zap size={16} /> สร้างเวร
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowExceptions(true)}
            disabled={loading}
            id="btn-open-exceptions"
          >
            <ShieldAlert size={16} /> ยกเว้น
            {exemptCount > 0 && (
              <span style={{
                background: 'var(--red)',
                color: '#fff',
                borderRadius: 'var(--r-full)',
                padding: '1px 6px',
                fontSize: '10px',
                fontWeight: '800',
                marginLeft: '-2px',
              }}>
                {exemptCount}
              </span>
            )}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowPunishments(true)}
            disabled={loading}
            id="btn-open-punishments"
            style={{ color: 'var(--red)', borderColor: 'var(--border)' }}
          >
            <Gavel size={16} /> ดองเวร
            {punishments.length > 0 && (
              <span style={{
                background: 'var(--red)',
                color: '#fff',
                borderRadius: 'var(--r-full)',
                padding: '1px 6px',
                fontSize: '10px',
                fontWeight: '800',
                marginLeft: '-2px',
              }}>
                {punishments.length}
              </span>
            )}
          </button>

          <div className="toolbar-separator" />

          <button
            className="btn btn-ghost"
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1); }}
            id="btn-go-today"
          >
            <CalendarIcon size={16} /> วันนี้
          </button>

          {loadingSchedule && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span className="loading-spinner" />
            </div>
          )}
        </div>

        {/* Calendar */}
        <Calendar
          year={year}
          month={month}
          scheduleData={scheduleData}
          personnel={personnel}
          onDayClick={(dateStr) => {
            setSelectedDate(dateStr);
            const dayAssignments = scheduleData.filter((a) => a.date === dateStr);
            if (dayAssignments.length === 0) {
              setShowQuickGenerate(true);
            }
          }}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
      </main>

      {/* ─── Bottom Navigation (Mobile) ─── */}
      <nav className="bottom-nav">
        <button
          className="bottom-nav-item active"
          onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1); }}
        >
          <CalendarIcon size={20} />
          <span>ปฏิทิน</span>
        </button>
        <button
          className="bottom-nav-item"
          onClick={() => setShowGenerate(true)}
          disabled={loading || personnel.length === 0}
        >
          <Zap size={20} />
          <span>สร้างเวร</span>
        </button>
        <button
          className="bottom-nav-item"
          onClick={() => setShowExceptions(true)}
        >
          <ShieldAlert size={20} />
          <span>ยกเว้น</span>
          {exemptCount > 0 && <span className="bottom-nav-badge">{exemptCount}</span>}
        </button>
        <button
          className="bottom-nav-item"
          onClick={() => setShowPunishments(true)}
        >
          <Gavel size={20} />
          <span>ดองเวร</span>
          {punishments.length > 0 && <span className="bottom-nav-badge">{punishments.length}</span>}
        </button>
        <Link
          href="/dashboard"
          className="bottom-nav-item"
        >
          <Activity size={20} />
          <span>สรุป</span>
        </Link>
      </nav>

      {/* ─── Modals ─── */}
      {selectedDate && !showQuickGenerate && (
        <DayDetailModal
          date={selectedDate}
          assignments={selectedDayAssignments}
          personnel={personnel}
          onClose={() => { setSelectedDate(null); setEditingAssignment(null); }}
          onEdit={(a) => setEditingAssignment(a)}
          onCopy={handleCopy}
          onOpenQuickGenerate={() => setShowQuickGenerate(true)}
        />
      )}

      {showQuickGenerate && selectedDate && (
        <QuickGenerateModal
          date={selectedDate}
          defaultStartId={getDefaultStartId(selectedDate)}
          personnel={personnel}
          onClose={() => setShowQuickGenerate(false)}
          onGenerate={handleGenerate}
        />
      )}

      {editingAssignment && (
        <EditShiftModal
          assignment={editingAssignment}
          personnel={personnel}
          onClose={() => setEditingAssignment(null)}
          onSave={handleSaveEdit}
        />
      )}

      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onGenerate={handleGenerate}
        />
      )}

      {showExceptions && (
        <ExceptionManager
          personnel={personnel}
          exceptions={exceptions}
          onAdd={handleAddException}
          onRemove={handleRemoveException}
          onClose={() => setShowExceptions(false)}
        />
      )}
      
      {showPunishments && (
        <PunishmentManager
          personnel={personnel}
          punishments={punishments}
          onAdd={handleAddPunishments}
          onRemove={handleRemovePunishment}
          onClose={() => setShowPunishments(false)}
        />
      )}

      {/* ─── PWA Install Banner ─── */}
      {showInstallBanner && deferredPrompt && (
        <div className="pwa-install-banner">
          <div className="pwa-text">
            📲 ติดตั้ง<strong>เวรทหาร</strong>บนหน้าจอหลัก
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowInstallBanner(false)}>
              ปิด
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleInstall}>
              ติดตั้ง
            </button>
          </div>
        </div>
      )}

      {/* ─── Toasts ─── */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
