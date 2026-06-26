'use client';
import React, { useState } from 'react';
import { Zap, Calendar, Hash, AlertTriangle, X } from 'lucide-react';

interface GenerateModalProps {
  onClose: () => void;
  onGenerate: (startDate: string, endDate: string, startFromId: number) => Promise<void>;
}

export default function GenerateModal({ onClose, onGenerate }: GenerateModalProps) {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(fmt(firstDay));
  const [endDate, setEndDate] = useState(fmt(lastDay));
  const [startFromId, setStartFromId] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handleGenerate = async () => {
    if (!confirm) {
      setConfirm(true);
      return;
    }
    setGenerating(true);
    try {
      await onGenerate(startDate, endDate, startFromId);
      onClose();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content generate-modal-content">
        <div className="modal-header">
          <div>
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Zap size={20} className="text-amber-500" /> สร้างตารางเวรอัตโนมัติ</div>
            <div className="modal-date">ระบบจะเรียงรหัสทหาร 1-125 วนซ้ำตามลำดับ</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="add-exception-form">
            <div className="edit-grid">
              <div className="edit-field">
                <label className="edit-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> วันที่เริ่มต้น</label>
                <input
                  type="date"
                  className="date-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="edit-field">
                <label className="edit-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> วันที่สิ้นสุด</label>
                <input
                  type="date"
                  className="date-input"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="edit-field">
              <label className="edit-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Hash size={14} /> เริ่มจากรหัสที่</label>
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
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}><AlertTriangle size={14} /> การสร้างตารางใหม่จะ<strong style={{color: 'var(--accent-red)'}}>เขียนทับ</strong>ข้อมูลเดิมในช่วงวันที่ที่เลือก</span>
              กรณียกเว้น (ผู้ป่วย, ธุระการ, ผู้ช่วยนายสิบ) จะถูกข้ามอัตโนมัติ
            </div>

            {confirm && (
              <div style={{
                padding: '12px 14px',
                background: 'rgba(201, 168, 76, 0.1)',
                border: '1px solid rgba(201, 168, 76, 0.3)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'var(--accent-gold)',
                fontWeight: '600',
                textAlign: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
              }}>
                <AlertTriangle size={14} /> กดปุ่ม "ยืนยันสร้าง" อีกครั้งเพื่อยืนยัน
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={generating || !startDate || !endDate}
            id="btn-confirm-generate"
          >
            {generating ? (
              <><span className="loading-spinner" /> กำลังสร้าง...</>
            ) : confirm ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={16} /> ยืนยันสร้าง</span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={16} /> สร้างตารางเวร</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
