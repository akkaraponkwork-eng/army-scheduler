import React from 'react';
import { X, Users, Activity, ShieldAlert, Clock } from 'lucide-react';
import { Personnel } from '@/lib/types';

interface PersonnelListModalProps {
  title: string;
  type: 'all' | 'active' | 'exempt' | 'punished';
  personnel: Personnel[];
  onClose: () => void;
}

export default function PersonnelListModal({ title, type, personnel, onClose }: PersonnelListModalProps) {
  const getIcon = () => {
    switch (type) {
      case 'all': return <Users size={18} className="text-blue-500" />;
      case 'active': return <Activity size={18} className="text-green-500" />;
      case 'exempt': return <ShieldAlert size={18} className="text-red-500" />;
      case 'punished': return <Clock size={18} className="text-orange-500" />;
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {getIcon()} {title}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {personnel.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
              ไม่มีข้อมูล
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {personnel.map((p, idx) => (
                <div key={`${p.id}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-active)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: '500' }}>{String(p.id).padStart(3, '0')} - {p.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>รวม {personnel.length} นาย</div>
          <button className="btn btn-secondary" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </div>
  );
}
