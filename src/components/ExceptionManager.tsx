'use client';
import React, { useState } from 'react';
import { ShieldAlert, Star, Clock, Activity, ClipboardList, Trash2, Save, X, Plus } from 'lucide-react';
import { Personnel, ExceptionEntry } from '@/lib/types';
import SearchableSelect from '@/components/SearchableSelect';

interface ExceptionManagerProps {
  personnel: Personnel[];
  exceptions: ExceptionEntry[];
  onAdd: (entry: ExceptionEntry) => Promise<void>;
  onRemove: (personnelId: number, startDate: string) => Promise<void>;
  onClose: () => void;
}

export default function ExceptionManager({
  personnel,
  exceptions,
  onAdd,
  onRemove,
  onClose,
}: ExceptionManagerProps) {
  const [form, setForm] = useState({
    personnelId: '',
    reason: 'sick' as 'sick' | 'admin_duty',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const personnelMap = new Map(personnel.map((p) => [p.id, p]));
  const activePersonnel = personnel.filter((p) => p.status === 'active');

  // Also show permanently exempt
  const permanentlyExempt = personnel.filter((p) => p.status === 'assistant_sergeant');

  const handleAdd = async () => {
    if (!form.personnelId) return;
    setAdding(true);
    try {
      await onAdd({
        personnelId: parseInt(form.personnelId),
        reason: form.reason,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      setShowForm(false);
      setForm({
        personnelId: '',
        reason: 'sick',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      });
    } finally {
      setAdding(false);
    }
  };

  const formatDateThai = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <div>
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={20} className="text-amber-500" /> จัดการกรณียกเว้น</div>
            <div className="modal-date">ผู้ป่วย / ธุระการ / ผู้ช่วยนายสิบ</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ gap: '12px' }}>
          {/* Permanently Exempt */}
          {permanentlyExempt.length > 0 && (
            <div className="exceptions-panel">
              <div className="exceptions-header">
                <span className="exceptions-header-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Star size={16} /> ผู้ช่วยนายสิบ (ยกเว้นถาวร)</span>
                <span className="badge badge-assistant">{permanentlyExempt.length} คน</span>
              </div>
              <div className="exceptions-body">
                {permanentlyExempt.map((p) => (
                  <div key={p.id} className="exception-item">
                    <div className="exception-info">
                      <div className="exception-name">
                        {String(p.id).padStart(3, '0')} – {p.name}
                      </div>
                    </div>
                    <span className="badge badge-assistant">ผช.นสบ.</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Temporary Exceptions */}
          <div className="exceptions-panel">
            <div className="exceptions-header">
              <span className="exceptions-header-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> ยกเว้นชั่วคราว</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="badge badge-sick">{exceptions.length} รายการ</span>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowForm(!showForm)}
                  id="btn-add-exception"
                >
                  {showForm ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><X size={14} /> ยกเลิก</span> : <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={14} /> เพิ่ม</span>}
                </button>
              </div>
            </div>

            {showForm && (
              <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="edit-grid">
                  <div className="edit-field">
                    <label className="edit-label">ชื่อทหาร</label>
                    <SearchableSelect
                      options={activePersonnel}
                      value={form.personnelId}
                      onChange={(val) => setForm({ ...form, personnelId: val })}
                      placeholder="พิมพ์เพื่อค้นหารหัส..."
                      emptyLabel="— เลือกทหาร —"
                    />
                  </div>
                  <div className="edit-field">
                    <label className="edit-label">เหตุผล</label>
                    <select
                      className="edit-select"
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value as 'sick' | 'admin_duty' })}
                    >
                      <option value="sick">ผู้ป่วย</option>
                      <option value="admin_duty">ธุระการ</option>
                    </select>
                  </div>
                </div>
                <div className="edit-grid">
                  <div className="edit-field">
                    <label className="edit-label">วันที่เริ่ม</label>
                    <input type="date" className="date-input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div className="edit-field">
                    <label className="edit-label">วันที่สิ้นสุด</label>
                    <input type="date" className="date-input" value={form.endDate} min={form.startDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleAdd}
                  disabled={adding || !form.personnelId}
                  id="btn-save-exception"
                >
                  {adding ? <><span className="loading-spinner" /> กำลังบันทึก...</> : <span style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}><Save size={16} /> บันทึก</span>}
                </button>
              </div>
            )}

            <div className="exceptions-body">
              {exceptions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  ไม่มีรายการยกเว้นชั่วคราว
                </div>
              ) : (
                exceptions.map((ex, idx) => {
                  const p = personnelMap.get(ex.personnelId);
                  return (
                    <div key={idx} className="exception-item">
                      <div className="exception-info">
                        <div className="exception-name">
                          {p ? `${String(p.id).padStart(3, '0')} – ${p.name}` : `รหัส ${ex.personnelId}`}
                        </div>
                        <div className="exception-meta">
                          {formatDateThai(ex.startDate)} ถึง {formatDateThai(ex.endDate)}
                        </div>
                      </div>
                      <span className={`badge ${ex.reason === 'sick' ? 'badge-sick' : 'badge-admin'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {ex.reason === 'sick' ? <Activity size={10} /> : <ClipboardList size={10} />}
                        {ex.reason === 'sick' ? 'ป่วย' : 'ธุระการ'}
                      </span>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => onRemove(ex.personnelId, ex.startDate)}
                        title="ลบ"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            รวมทั้งหมด {permanentlyExempt.length + exceptions.length} คนที่ได้รับการยกเว้น
          </div>
          <button className="btn btn-secondary" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </div>
  );
}
