'use client';
import React, { useState, useMemo } from 'react';
import { DutyAssignment, Personnel, SHIFT_TIMES, DUTY_POSITIONS } from '@/lib/types';
import { Search, X, Calendar as CalendarIcon, Clock } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

interface SearchModalProps {
  personnel: Personnel[];
  scheduleData: DutyAssignment[];
  onClose: () => void;
}

export default function SearchModal({
  personnel,
  scheduleData,
  onClose,
}: SearchModalProps) {
  const [selectedId, setSelectedId] = useState<string>('');

  const personnelMap = new Map(personnel.map(p => [p.id, p]));

  const myAssignments = useMemo(() => {
    if (!selectedId) return [];
    const idNum = parseInt(selectedId);
    return scheduleData
      .filter(a => a.personIds?.includes(idNum))
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.shift - b.shift;
      });
  }, [scheduleData, selectedId]);

  const formatDateThai = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  };

  const selectedPerson = selectedId ? personnelMap.get(parseInt(selectedId)) : null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div>
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={20} className="text-blue-500" /> ค้นหาคิวเวรรายบุคคล
            </div>
            <div className="modal-date">เลือกชื่อเพื่อดูเวรทั้งหมดในเดือนนี้</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="ปิด" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '20px' }}>
            <SearchableSelect
              options={personnel}
              value={selectedId}
              onChange={setSelectedId}
              placeholder="พิมพ์รหัสหรือชื่อทหาร..."
            />
          </div>

          {selectedId && selectedPerson && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{String(selectedPerson.id).padStart(3, '0')} - {selectedPerson.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>สถานะ: {selectedPerson.status === 'active' ? 'ปกติ' : selectedPerson.status === 'assistant_sergeant' ? 'ผู้ช่วยสิบเวร' : 'ยกเว้น'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--blue)' }}>{myAssignments.length}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>เวรในเดือนนี้</div>
                </div>
              </div>

              {myAssignments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                  {myAssignments.map((a, idx) => {
                    const shiftInfo = SHIFT_TIMES.find(s => s.shift === a.shift);
                    const posInfo = DUTY_POSITIONS.find(p => p.key === a.position);
                    return (
                      <div key={idx} style={{ 
                        background: 'var(--surface-mixed)', 
                        border: '1px solid var(--border-light)', 
                        borderRadius: '8px', 
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}>
                            <CalendarIcon size={14} className="text-amber-500" /> {formatDateThai(a.date)}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            {posInfo?.icon} {posInfo?.label}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600', color: `var(--shift${a.shift})`, justifyContent: 'flex-end' }}>
                            <Clock size={12} /> {shiftInfo?.label}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                            {shiftInfo?.start} - {shiftInfo?.end}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-faint)' }}>
                  <div style={{ marginBottom: '8px', opacity: 0.5 }}><Search size={32} style={{ margin: '0 auto' }} /></div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-muted)' }}>ไม่พบตารางเวร</div>
                  <div style={{ fontSize: '12px' }}>ทหารนายนี้ไม่มีเวรในเดือนที่เลือก</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
