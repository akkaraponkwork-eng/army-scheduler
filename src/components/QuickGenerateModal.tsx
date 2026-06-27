'use client';
import React, { useState } from 'react';
import { Zap, Calendar, Hash, X, AlertTriangle } from 'lucide-react';
import { Personnel } from '@/lib/types';
import MultiSearchableSelect from './MultiSearchableSelect';

interface QuickGenerateModalProps {
  date: string;
  defaultStartId: number;
  personnel: Personnel[];
  onClose: () => void;
  onGenerate: (startDate: string, endDate: string, startFromId: number, assistantSergeants: number[]) => Promise<void>;
}

export default function QuickGenerateModal({ date, defaultStartId, personnel, onClose, onGenerate }: QuickGenerateModalProps) {
  const [startFromId, setStartFromId] = useState(defaultStartId);
  const [assistantSergeants, setAssistantSergeants] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

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

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const astIds = assistantSergeants.map(id => parseInt(id)).filter(id => !isNaN(id));
      await onGenerate(date, date, startFromId, astIds);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content generate-modal-content">
        <div className="modal-header">
          <div>
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Zap size={20} className="text-amber-500" /> สร้างเวรรายวัน</div>
            <div className="modal-date">{formatDate(date)}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="add-exception-form">
            <div className="edit-field" style={{ zIndex: 10 }}>
              <label className="edit-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>ผู้ช่วยสิบเวร (เฉพาะวันนี้)</label>
              <MultiSearchableSelect
                options={personnel.filter(p => p.status === 'active')}
                values={assistantSergeants}
                onChange={setAssistantSergeants}
                placeholder="เลือกผู้เข้าเวรผู้ช่วย..."
              />
              <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '4px' }}>
                * รายชื่อที่เลือกจะถูกบันทึกลงการยกเว้นของวันนี้โดยอัตโนมัติ
              </div>
            </div>

            <div className="edit-field">
              <label className="edit-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Hash size={14} /> เริ่มจากรหัสที่ (คำนวณอัตโนมัติจากเมื่อวาน)</label>
              <input
                type="number"
                className="date-input"
                value={startFromId}
                min={1}
                max={125}
                onChange={(e) => setStartFromId(parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div style={{
              padding: '12px 14px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              marginTop: '8px'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}><AlertTriangle size={14} /> การสร้างจะ<strong style={{color: 'var(--accent-red)'}}>เขียนทับ</strong>เวรของวันนี้</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <><span className="loading-spinner" /> กำลังสร้าง...</>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={16} /> ยืนยันสร้างเวร</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
