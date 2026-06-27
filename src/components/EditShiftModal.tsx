'use client';
import React, { useState, useEffect } from 'react';
import { DutyAssignment, Personnel, SHIFT_TIMES, DUTY_POSITIONS, DutyPosition } from '@/lib/types';
import { Edit2, User, Lightbulb, Save, X } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';

interface EditShiftModalProps {
  assignment: DutyAssignment;
  personnel: Personnel[];
  onClose: () => void;
  onSave: (updated: DutyAssignment) => Promise<void>;
}

export default function EditShiftModal({
  assignment,
  personnel,
  onClose,
  onSave,
}: EditShiftModalProps) {
  const [person1Id, setPerson1Id] = useState<string>(String(assignment.person1Id ?? ''));
  const [person2Id, setPerson2Id] = useState<string>(String(assignment.person2Id ?? ''));
  const [saving, setSaving] = useState(false);

  const shiftInfo = SHIFT_TIMES.find((s) => s.shift === assignment.shift);
  const positionInfo = DUTY_POSITIONS.find((p) => p.key === assignment.position);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        ...assignment,
        person1Id: person1Id ? parseInt(person1Id) : null,
        person2Id: person2Id ? parseInt(person2Id) : null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content edit-modal-content">
        <div className="modal-header">
          <div>
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Edit2 size={20} className="text-blue-500" /> แก้ไขเวร</div>
            <div className="modal-date">
              {shiftInfo?.label} ({shiftInfo?.start}–{shiftInfo?.end} น.) · {positionInfo?.label}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="edit-grid">
            <div className="edit-field">
              <label className="edit-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> คนที่ 1</label>
              <SearchableSelect
                options={personnel}
                value={person1Id}
                onChange={setPerson1Id}
                placeholder="พิมพ์เพื่อค้นหารหัส..."
                emptyLabel="— ไม่ระบุ —"
              />
            </div>

            <div className="edit-field">
              <label className="edit-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> คนที่ 2</label>
              <SearchableSelect
                options={personnel}
                value={person2Id}
                onChange={setPerson2Id}
                placeholder="พิมพ์เพื่อค้นหารหัส..."
                emptyLabel="— ไม่ระบุ —"
              />
            </div>
          </div>

          <div style={{
            padding: '12px 14px',
            background: 'rgba(201, 168, 76, 0.06)',
            border: '1px solid rgba(201, 168, 76, 0.2)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'flex-start', gap: '6px'
          }}>
            <Lightbulb size={16} className="text-amber-500" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>สามารถเลือกกำลังพลได้ <strong>ทั้งหมด</strong> (รวมถึงผู้ที่มีสถานะยกเว้นหรือป่วย)</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            id="btn-save-edit"
          >
            {saving ? (
              <><span className="loading-spinner" /> กำลังบันทึก...</>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Save size={16} /> บันทึก</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
