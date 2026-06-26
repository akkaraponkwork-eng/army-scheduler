'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Personnel } from '@/lib/types';

interface SearchableSelectProps {
  options: Personnel[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
}

export default function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "ค้นหารหัสหรือชื่อ...",
  emptyLabel = "— ไม่ระบุ —"
}: SearchableSelectProps) {
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

  const selectedOption = options.find(o => String(o.id) === value);
  const displayValue = selectedOption ? `${String(selectedOption.id).padStart(3, '0')} - ${selectedOption.name}` : '';

  const filteredOptions = options.filter(o => 
    String(o.id).includes(query) || 
    o.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="searchable-select" ref={wrapperRef}>
      <div 
        className="select-trigger" 
        onClick={() => { setOpen(!open); setQuery(''); }}
      >
        <span className={selectedOption ? 'has-value' : 'is-empty'}>
          {selectedOption ? displayValue : placeholder}
        </span>
        <ChevronDown size={14} style={{ color: 'var(--text-faint)' }} />
      </div>

      {open && (
        <div className="select-dropdown">
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
            <div 
              className={`select-option ${!value ? 'selected' : ''}`}
              onClick={() => { onChange(''); setOpen(false); }}
            >
              {emptyLabel}
            </div>
            {filteredOptions.length === 0 ? (
              <div className="select-option empty">ไม่พบข้อมูล</div>
            ) : (
              filteredOptions.map(o => (
                <div
                  key={o.id}
                  className={`select-option ${value === String(o.id) ? 'selected' : ''}`}
                  onClick={() => { onChange(String(o.id)); setOpen(false); }}
                >
                  {String(o.id).padStart(3, '0')} - {o.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
