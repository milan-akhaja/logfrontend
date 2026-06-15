import React, { useState, useEffect } from 'react';

export default function SizeChartModal({ isOpen, onClose }) {
  const [unit, setUnit] = useState('INCH'); // INCH or CM

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Chart data in inches
  const chartData = [
    { size: 'S', chest: 42, length: 28, sleeve: 8.5 },
    { size: 'M', chest: 44, length: 28.5, sleeve: 9 },
    { size: 'L', chest: 46, length: 29, sleeve: 9 },
    { size: 'XL', chest: 48, length: 30, sleeve: 9.5 }
  ];

  // Helper to convert inches to cm (1 inch = 2.54 cm)
  const formatVal = (inchVal) => {
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
              </tr>
            </thead>
            <tbody>
              {chartData.map((row) => (
                <tr key={row.size}>
                  <td><strong>{row.size}</strong></td>
                  <td>{formatVal(row.chest)}</td>
                  <td>{formatVal(row.length)}</td>
                  <td>{formatVal(row.sleeve)}</td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}
