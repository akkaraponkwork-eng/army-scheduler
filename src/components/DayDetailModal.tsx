'use client';
import React, { useState, useCallback } from 'react';
import { DutyAssignment, Personnel, SHIFT_TIMES, DUTY_POSITIONS, ExceptionEntry } from '@/lib/types';
import { Clipboard, Edit2, Inbox, Check, Copy, X, ChevronDown, Zap, Star } from 'lucide-react';

interface DayDetailModalProps {
  date: string;
  assignments: DutyAssignment[];
  personnel: Personnel[];
  exceptions: ExceptionEntry[];
  onClose: () => void;
  onEdit: (assignment: DutyAssignment) => void;
  onCopy: () => void;
  onOpenQuickGenerate?: () => void;
  isAdmin?: boolean;
}

const SHIFT_COLORS = ['s1', 's2', 's3', 's4'];

const POS_CLASS: Record<string, string> = {
  north_armory: 'pos-north',
  central_porch: 'pos-central',
  south_armory: 'pos-south',
};

export default function DayDetailModal({
  date,
  assignments,
  personnel,
  exceptions,
  onClose,
  onEdit,
  onCopy,
  onOpenQuickGenerate,
  isAdmin = false
}: DayDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const personnelMap = new Map(personnel.map((p) => [p.id, p]));
  const [openShifts, setOpenShifts] = useState<number[]>([]);

  React.useEffect(() => {
    // Open all on desktop, open only shift 1 on mobile
    if (window.innerWidth > 768) {
      setOpenShifts([1, 2, 3, 4]);
    } else {
      setOpenShifts([1]);
    }
  }, []);

  const toggleShift = (shift: number) => {
    setOpenShifts(prev => prev.includes(shift) ? prev.filter(s => s !== shift) : [...prev, shift]);
  };

  const formatDate = (d: string) => {
    const dateObj = new Date(d);
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
    ];
    const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const thaiYear = dateObj.getFullYear() + 543;
    return `วัน${thaiDays[dateObj.getDay()]}ที่ ${dateObj.getDate()} ${thaiMonths[dateObj.getMonth()]} ${thaiYear}`;
  };

  const handleCopy = useCallback(() => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onCopy]);

  // Count total assigned personnel
  const totalAssigned = assignments.reduce((sum, a) => sum + (a.personIds?.length || 0), 0);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clipboard size={20} className="text-blue-500" /> ตารางเวร</div>
            <div className="modal-date">{formatDate(date)}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="ปิด" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {assignments.length > 0 && (
            (() => {
              const dailyAssistants = exceptions
                .filter(e => e.reason === 'ผู้ช่วยสิบเวร' && e.startDate <= date && e.endDate >= date)
                .map(e => personnelMap.get(e.personnelId))
                .filter(Boolean) as Personnel[];

              if (dailyAssistants.length === 0) return null;

              return (
                <div style={{
                  marginBottom: '16px',
                  background: 'var(--amber-dim)',
                  border: '1px solid var(--amber)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <Star size={18} style={{ color: 'var(--accent-gold)', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-gold)', marginBottom: '4px' }}>
                      ผู้ช่วยสิบเวรประจำวัน
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {dailyAssistants.map(p => (
                        <div key={p.id} style={{ 
                          background: 'rgba(255,255,255,0.5)', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          color: 'var(--text-main)',
                          fontWeight: '500'
                        }}>
                          {String(p.id).padStart(3, '0')} - {p.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()
          )}

          {SHIFT_TIMES.map((shiftInfo, idx) => {
            const shiftAssignments = assignments.filter((a) => a.shift === shiftInfo.shift);
            const isOpen = openShifts.includes(shiftInfo.shift);
            return (
              <div key={shiftInfo.shift} className="shift-section" style={{ marginBottom: '12px', border: '1px solid var(--border-light)', borderRadius: '10px', overflow: 'hidden' }}>
                <div 
                  className={`shift-header ${SHIFT_COLORS[idx]}`} 
                  onClick={() => toggleShift(shiftInfo.shift)}
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: isOpen ? '10px 10px 0 0' : '10px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600 }}>{shiftInfo.label}</span>
                    <span className="shift-time" style={{ opacity: 0.8, fontSize: '12px' }}>({shiftInfo.start} – {shiftInfo.end})</span>
                  </div>
                  <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', opacity: 0.7 }} />
                </div>
                
                {isOpen && (
                  <div className="shift-positions" style={{ padding: '12px', background: 'var(--card-bg)' }}>
                    {DUTY_POSITIONS.map((pos) => {
                      const a = shiftAssignments.find((x) => x.position === pos.key);
                      const pList = a?.personIds?.map(id => personnelMap.get(id)).filter(Boolean) as Personnel[] || [];

                    return (
                      <div key={pos.key} className={`position-cell ${POS_CLASS[pos.key]}`}>
                        <div className="position-label">
                          <span className="position-dot" />
                          {pos.label}
                          {a && isAdmin && (
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              style={{ marginLeft: 'auto', padding: '4px', minWidth: 'auto', minHeight: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => onEdit(a)}
                              aria-label={`แก้ไข ${pos.label}`}
                            >
                              <Edit2 size={12} />
                            </button>
                          )}
                        </div>
                        <div className="personnel-badge">
                          {pList.length > 0 ? (
                            pList.map(p => (
                              <div key={p.id} className="personnel-item">
                                <span className="personnel-id">{String(p.id).padStart(3, '0')}</span>
                                <span className="personnel-name">{p.name}</span>
                              </div>
                            ))
                          ) : (
                            <div className="personnel-empty">— ว่าง —</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            );
          })}

          {assignments.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1.5rem',
              color: 'var(--text-faint)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', opacity: 0.5 }}><Inbox size={48} /></div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-muted)' }}>
                ยังไม่มีตารางเวรวันนี้
              </div>
              <div style={{ fontSize: '12px', marginTop: '8px', color: 'var(--text-faint)', marginBottom: '16px' }}>
                {isAdmin ? 'กดปุ่มด้านล่างเพื่อจัดเวรอัตโนมัติ' : 'กรุณารอผู้ดูแลระบบจัดตารางเวร'}
              </div>
              {onOpenQuickGenerate && isAdmin && (
                <button className="btn btn-primary" onClick={onOpenQuickGenerate} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={16} /> สร้างเวรรายวัน
                </button>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: '500' }}>
            {totalAssigned > 0 ? `${totalAssigned} นาย` : ''}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {assignments.length > 0 && onOpenQuickGenerate && isAdmin && (
              <button
                className="btn btn-ghost"
                onClick={onOpenQuickGenerate}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={14} className="text-amber-500" /> จัดเวรใหม่</span>
              </button>
            )}
            {assignments.length > 0 && (
              <button
                className={`btn ${copied ? 'btn-primary' : 'btn-copy'}`}
                onClick={handleCopy}
                id="btn-copy-schedule"
              >
                {copied ? <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14} /> คัดลอกแล้ว</span> : <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Copy size={14} /> คัดลอก</span>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
