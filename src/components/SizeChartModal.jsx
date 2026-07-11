import React, { useState, useEffect } from 'react';
import { lockBodyScroll, unlockBodyScroll } from '../lib/scrollLock';

const DEFAULT_CHART_DATA = [
  { size: 'S', chest: 42, length: 28, sleeve: 8.5, shoulder: '' },
  { size: 'M', chest: 44, length: 28.5, sleeve: 9, shoulder: '' },
  { size: 'L', chest: 46, length: 29, sleeve: 9, shoulder: '' },
  { size: 'XL', chest: 48, length: 30, sleeve: 9.5, shoulder: '' }
];

function normalizeChartRows(sizeChart) {
  const rows = Array.isArray(sizeChart) && sizeChart.length ? sizeChart : DEFAULT_CHART_DATA;
  const normalized = rows
    .map((row) => {
      const source = row && typeof row === 'object' ? row : {};
      const cleanNumber = (field) => {
        if (source[field] === undefined || source[field] === null || source[field] === '') return '';
        const parsed = Number(source[field]);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : '';
      };
      return {
        size: String(source.size || '').toUpperCase(),
        chest: cleanNumber('chest'),
        length: cleanNumber('length'),
        sleeve: cleanNumber('sleeve'),
        shoulder: cleanNumber('shoulder')
      };
    })
    .filter((row) => row.size);
  return normalized.length ? normalized : DEFAULT_CHART_DATA;
}

export default function SizeChartModal({ isOpen, onClose, sizeChart }) {
  const [unit, setUnit] = useState('INCH'); // INCH or CM

  useEffect(() => {
    if (isOpen) {
      lockBodyScroll();
    }
    return () => {
      if (isOpen) unlockBodyScroll();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const chartData = normalizeChartRows(sizeChart);
  const showShoulder = chartData.some((row) => row.shoulder !== '');

  // Helper to convert inches to cm (1 inch = 2.54 cm)
  const formatVal = (inchVal) => {
    if (inchVal === '') return '-';
    if (unit === 'CM') {
      return (inchVal * 2.54).toFixed(1);
    }
    return inchVal;
  };

  return (
    <div className="size-modal-overlay" onClick={onClose}>
      <div className="size-modal" onClick={(e) => e.stopPropagation()}>
        <div className="size-modal-header">
          <h3>Size Guide</h3>
          <div className="unit-toggle">
            <button 
              className={unit === 'INCH' ? 'active' : ''} 
              onClick={() => setUnit('INCH')}
            >
              IN
            </button>
            <button 
              className={unit === 'CM' ? 'active' : ''} 
              onClick={() => setUnit('CM')}
            >
              CM
            </button>
          </div>
          <button className="size-modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="size-modal-body">
          <table className="size-chart-table">
            <thead>
              <tr>
                <th>Size</th>
                <th>Chest ({unit.toLowerCase()})</th>
                <th>Length ({unit.toLowerCase()})</th>
                <th>Sleeve Length ({unit.toLowerCase()})</th>
                {showShoulder && <th>Shoulder ({unit.toLowerCase()})</th>}
              </tr>
            </thead>
            <tbody>
              {chartData.map((row) => (
                <tr key={row.size}>
                  <td><strong>{row.size}</strong></td>
                  <td>{formatVal(row.chest)}</td>
                  <td>{formatVal(row.length)}</td>
                  <td>{formatVal(row.sleeve)}</td>
                  {showShoulder && <td>{formatVal(row.shoulder)}</td>}
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}
