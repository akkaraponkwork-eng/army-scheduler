'use client';
import React, { useState } from 'react';
import { ShieldAlert, Star, Clock, Activity, ClipboardList, Trash2, Save, X, Plus, Edit2 } from 'lucide-react';
import { Personnel, PunishmentEntry } from '@/lib/types';
import SearchableSelect from '@/components/SearchableSelect';

interface PunishmentManagerProps {
  personnel: Personnel[];
  punishments: PunishmentEntry[];
  onAdd: (entries: PunishmentEntry[]) => Promise<void>;
  onRemove: (personnelId: number, startDate: string) => Promise<void>;
  onClose: () => void;
}

export default function PunishmentManager({
  personnel,
  punishments,
  onAdd,
  onRemove,
  onClose,
}: PunishmentManagerProps) {
  const [form, setForm] = useState({
    shift: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentSelect, setCurrentSelect] = useState('');
  
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PunishmentEntry | null>(null);

  const personnelMap = new Map(personnel.map((p) => [p.id, p]));
  const activePersonnel = personnel.filter((p) => p.status === 'active');

  const handleSelectPerson = (val: string) => {
    if (!val) return;
    const id = parseInt(val);
    if (!selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
    setCurrentSelect(''); // reset
  };

  const removeSelectedPerson = (id: number) => {
    setSelectedIds(selectedIds.filter(x => x !== id));
  };

  const handleAdd = async () => {
    if (selectedIds.length === 0) return;
    setAdding(true);
    try {
      if (editingEntry) {
        await onRemove(editingEntry.personnelId, editingEntry.startDate);
      }
      
      const entries: PunishmentEntry[] = selectedIds.map(id => ({
        personnelId: id,
        shift: form.shift,
        startDate: form.startDate,
        endDate: form.endDate,
      }));
      
      await onAdd(entries);
      
      setShowForm(false);
      setSelectedIds([]);
      setEditingEntry(null);
      setForm({
        shift: 1,
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
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} className="text-red-500" /> จัดการดองเวร (Punishment)
            </div>
            <div className="modal-date">กำหนดผลัดและวันที่เข้าเวรให้เฉพาะบุคคล</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ gap: '12px' }}>
          <div className="exceptions-panel">
            <div className="exceptions-header">
              <span className="exceptions-header-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> รายการดองเวร</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="badge badge-sick">{punishments.length} รายการ</span>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    if (showForm) {
                      setShowForm(false);
                      setEditingEntry(null);
                      setSelectedIds([]);
                    } else {
                      setShowForm(true);
                    }
                  }}
                  id="btn-add-punishment"
                >
                  {showForm ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><X size={14} /> ยกเลิก</span> : <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={14} /> เพิ่ม</span>}
                </button>
              </div>
            </div>

            {showForm && (
              <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="edit-grid">
                  <div className="edit-field" style={{ gridColumn: 'span 2' }}>
                    <label className="edit-label">เพิ่มชื่อทหาร (เลือกได้หลายคน)</label>
                    <SearchableSelect
                      options={activePersonnel}
                      value={currentSelect}
                      onChange={handleSelectPerson}
                      placeholder="พิมพ์เพื่อค้นหารหัส..."
                      emptyLabel="— เลือกทหาร —"
                    />
                    {selectedIds.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {selectedIds.map(id => {
                          const p = personnelMap.get(id);
                          return (
                            <div key={id} className="badge badge-sick" style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => removeSelectedPerson(id)}>
                              {p ? `${String(p.id).padStart(3, '0')} ${p.name}` : id}
                              <X size={12} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="edit-grid">
                  <div className="edit-field">
                    <label className="edit-label">ผลัดที่กำหนด</label>
                    <select
                      className="edit-select"
                      value={form.shift}
                      onChange={(e) => setForm({ ...form, shift: parseInt(e.target.value) })}
                    >
                      <option value={1}>ผลัด 1 (21:00-23:00)</option>
                      <option value={2}>ผลัด 2 (23:00-01:00)</option>
                      <option value={3}>ผลัด 3 (01:00-03:00)</option>
                      <option value={4}>ผลัด 4 (03:00-05:00)</option>
                    </select>
                  </div>
                  <div className="edit-field">
                    
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
                  disabled={adding || selectedIds.length === 0}
                  id="btn-save-punishment"
                >
                  {adding ? <><span className="loading-spinner" /> กำลังบันทึก...</> : <span style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}><Save size={16} /> บันทึก</span>}
                </button>
              </div>
            )}

            <div className="exceptions-body">
              {punishments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  ไม่มีรายการดองเวร
                </div>
              ) : (
                punishments.map((ex, idx) => {
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
                      <span className="badge badge-admin" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-active)' }}>
                        <Clock size={10} />
                        ผลัด {ex.shift}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setEditingEntry(ex);
                            setSelectedIds([ex.personnelId]);
                            setForm({
                              shift: ex.shift,
                              startDate: ex.startDate,
                              endDate: ex.endDate
                            });
                            setShowForm(true);
                            // Scroll to top
                            document.querySelector('.modal-content')?.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          title="แก้ไข"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => onRemove(ex.personnelId, ex.startDate)}
                          title="ลบ"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            รวมทั้งหมด {punishments.length} รายการ
          </div>
          <button className="btn btn-secondary" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </div>
  );
}
