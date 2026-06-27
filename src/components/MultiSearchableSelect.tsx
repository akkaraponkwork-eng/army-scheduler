'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { Personnel } from '@/lib/types';

interface MultiSearchableSelectProps {
  options: Personnel[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyLabel?: string;
}

export default function MultiSearchableSelect({ 
  options, 
  values, 
  onChange, 
  placeholder = "ค้นหารหัสหรือชื่อ...",
  emptyLabel = "ไม่มีผู้ช่วยสิบเวร"
}: MultiSearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOptions = values.map(v => options.find(o => String(o.id) === v)).filter(Boolean) as Personnel[];

  const filteredOptions = options.filter(o => 
    String(o.id).includes(query) || 
    o.name.toLowerCase().includes(query.toLowerCase())
  );

  const toggleOption = (idStr: string) => {
    if (values.includes(idStr)) {
      onChange(values.filter(v => v !== idStr));
    } else {
      onChange([...values, idStr]);
    }
  };

  const removeOption = (e: React.MouseEvent, idStr: string) => {
    e.stopPropagation();
    onChange(values.filter(v => v !== idStr));
  };

  return (
    <div className="searchable-select" ref={wrapperRef}>
      <div 
        className="select-trigger" 
        onClick={() => { setOpen(!open); setQuery(''); }}
        style={{ minHeight: '44px', height: 'auto', padding: '6px 12px', flexWrap: 'wrap', gap: '4px' }}
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map(opt => (
            <div key={opt.id} style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'var(--primary-blue-100)', color: 'var(--primary-blue-700)',
              padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500
            }}>
              {String(opt.id).padStart(3, '0')}
              <button 
                onClick={(e) => removeOption(e, String(opt.id))}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'inherit', padding: 0 }}
              >
                <X size={12} />
              </button>
            </div>
          ))
        ) : (
          <span className="is-empty">{placeholder}</span>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <ChevronDown size={14} style={{ color: 'var(--text-faint)' }} />
        </div>
      </div>

      {open && (
        <div className="select-dropdown" style={{ zIndex: 100 }}>
          <div className="select-search-box">
            <Search size={14} style={{ color: 'var(--text-faint)' }} />
            <input
              autoFocus
              type="text"
              placeholder="พิมพ์รหัส 1-125 หรือชื่อ..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="select-search-input"
            />
          </div>
          <div className="select-options">
            {filteredOptions.length === 0 ? (
              <div className="select-option empty">ไม่พบข้อมูล</div>
            ) : (
              filteredOptions.map(o => {
                const isSelected = values.includes(String(o.id));
                return (
                  <div
                    key={o.id}
                    className={`select-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleOption(String(o.id))}
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>{String(o.id).padStart(3, '0')} - {o.name}</span>
                    {isSelected && <span style={{ color: 'var(--primary-blue-600)', fontSize: '12px' }}>✓</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
