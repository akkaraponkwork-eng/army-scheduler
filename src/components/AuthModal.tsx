'use client';
import React, { useState } from 'react';
import { Lock, X, LogIn } from 'lucide-react';

interface AuthModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function AuthModal({ onSuccess, onClose }: AuthModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') { // Admin PIN
      onSuccess();
    } else {
      setError('รหัสผ่านไม่ถูกต้อง');
      setPin('');
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '320px', padding: '24px' }}>
        <button 
          className="btn btn-ghost btn-icon" 
          onClick={onClose} 
          style={{ position: 'absolute', top: '12px', right: '12px' }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ background: 'var(--amber-dim)', color: 'var(--amber)', padding: '16px', borderRadius: '50%' }}>
              <Lock size={32} />
            </div>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>เข้าสู่ระบบผู้ดูแล</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-faint)' }}>กรุณาใส่รหัส PIN เพื่อจัดการตารางเวร</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(''); }}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '24px',
                textAlign: 'center',
                letterSpacing: '8px',
                borderRadius: '8px',
                border: `2px solid ${error ? 'var(--red)' : 'var(--border)'}`,
                background: 'var(--surface-mixed)',
                color: 'var(--text-main)',
                outline: 'none',
              }}
              placeholder="••••"
              autoFocus
            />
            {error && <div style={{ color: 'var(--red)', fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>{error}</div>}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            disabled={pin.length < 4}
          >
            <LogIn size={18} /> เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  );
}
