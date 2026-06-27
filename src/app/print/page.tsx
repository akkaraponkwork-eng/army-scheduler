'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DutyAssignment, Personnel, SHIFT_TIMES, DUTY_POSITIONS } from '@/lib/types';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function PrintContent() {
  const searchParams = useSearchParams();
  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');
  
  const today = new Date();
  const year = yearParam ? parseInt(yearParam) : today.getFullYear();
  const month = monthParam ? parseInt(monthParam) : today.getMonth() + 1;

  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [scheduleData, setScheduleData] = useState<DutyAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [perRes, schRes] = await Promise.all([
          fetch('/api/personnel'),
          fetch(`/api/schedule?year=${year}&month=${month}`)
        ]);

        if (perRes.ok) setPersonnel(await perRes.json());
        if (schRes.ok) setScheduleData(await schRes.json());
      } catch (err) {
        console.error('Failed to load print data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year, month]);

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>กำลังโหลดข้อมูลสำหรับการพิมพ์...</div>;
  }

  const personnelMap = new Map(personnel.map(p => [p.id, p]));
  
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];

  return (
    <div className="print-container">
      <div className="no-print" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
        <Link href="/" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> กลับหน้าแรก
        </Link>
        <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Printer size={16} /> พิมพ์ / บันทึกเป็น PDF
        </button>
      </div>

      <div className="print-page">
        <div className="print-header">
          <h2>ตารางการปฏิบัติหน้าที่เวรยาม</h2>
          <h3>ประจำเดือน {THAI_MONTHS[month - 1]} พ.ศ. {year + 543}</h3>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th rowSpan={2} style={{ width: '40px' }}>วันที่</th>
              {DUTY_POSITIONS.map(pos => (
                <th key={pos.key} colSpan={4}>{pos.label}</th>
              ))}
            </tr>
            <tr>
              {DUTY_POSITIONS.map(pos => (
                <React.Fragment key={pos.key}>
                  {SHIFT_TIMES.map(shift => (
                    <th key={shift.shift} style={{ fontSize: '10px' }}>ผ.{shift.shift}<br/>{shift.start}-{shift.end}</th>
                  ))}
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map(day => {
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayAssignments = scheduleData.filter(a => a.date === dateStr);
              
              return (
                <tr key={day}>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{day}</td>
                  {DUTY_POSITIONS.map(pos => (
                    <React.Fragment key={pos.key}>
                      {SHIFT_TIMES.map(shift => {
                        const assignment = dayAssignments.find(a => a.position === pos.key && a.shift === shift.shift);
                        const p1Id = assignment?.personIds?.[0];
                        const p1 = p1Id ? personnelMap.get(p1Id) : null;
                        const p2Id = assignment?.personIds?.[1];
                        const p2 = p2Id ? personnelMap.get(p2Id) : null;
                        
                        return (
                          <td key={shift.shift} style={{ fontSize: '10px', textAlign: 'center', verticalAlign: 'top', padding: '4px' }}>
                            {p1 ? <div>{String(p1.id).padStart(3, '0')} {p1.name.split(' ')[0]}</div> : '-'}
                            {p2 ? <div>{String(p2.id).padStart(3, '0')} {p2.name.split(' ')[0]}</div> : ''}
                          </td>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .print-container { background: #fff; min-height: 100vh; color: #000; font-family: 'Sarabun', 'Inter', sans-serif; }
        .print-page { padding: 20px 40px; max-width: 1200px; margin: 0 auto; }
        .print-header { text-align: center; margin-bottom: 20px; }
        .print-header h2 { font-size: 20px; margin: 0 0 8px 0; }
        .print-header h3 { font-size: 16px; margin: 0; font-weight: normal; }
        .print-table { width: 100%; border-collapse: collapse; }
        .print-table th, .print-table td { border: 1px solid #000; padding: 4px; }
        .print-table th { background: #f0f0f0; text-align: center; font-size: 12px; }
        @media print {
          .no-print { display: none !important; }
          .print-container { background: none; }
          .print-page { padding: 0; max-width: none; }
          @page { size: landscape; margin: 1cm; }
        }
      `}} />
    </div>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center' }}>กำลังเตรียมหน้าพิมพ์...</div>}>
      <PrintContent />
    </Suspense>
  );
}
