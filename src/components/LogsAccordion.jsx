import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import { FiDownload } from 'react-icons/fi';
import TripLogDocument from './TripLogDocument';

// Keep your existing drawEldGrid function exactly as it is...
function drawEldGrid(canvas, segments, onDutyHours, drivingHours, totalMiles, remarks, date) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = 900;
  canvas.height = 300;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const leftMargin = 90;
  const rightMargin = 20;
  const topMargin = 40;
  const bottomMargin = 70;
  const gridTop = topMargin;
  const gridBottom = canvas.height - bottomMargin;
  const gridHeight = gridBottom - gridTop;
  const rowHeight = gridHeight / 4;
  const startX = leftMargin;
  const endX = canvas.width - rightMargin;
  const colWidth = (endX - startX) / 24;
  const rowLabels = ['Off Duty', 'Sleeper', 'Driving', 'On Duty'];
  const rowY = [gridTop + rowHeight / 2, gridTop + rowHeight * 1.5, gridTop + rowHeight * 2.5, gridTop + rowHeight * 3.5];

  ctx.font = '10px "Courier New"';
  ctx.fillStyle = '#333';
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 0.5;

  for (let i = 0; i <= 24; i++) {
    const x = startX + i * colWidth;
    ctx.beginPath();
    ctx.moveTo(x, gridTop);
    ctx.lineTo(x, gridBottom);
    ctx.stroke();
    if (i % 2 === 0 || i === 24) ctx.fillText(i.toString(), x - 5, gridTop - 5);
  }
  for (let r = 0; r <= 4; r++) {
    const y = gridTop + r * rowHeight;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
  }
  ctx.font = '11px "Courier New"';
  ctx.fillStyle = '#000';
  for (let r = 0; r < 4; r++) ctx.fillText(rowLabels[r], 10, rowY[r] + 4);

  const statusToRow = { off_duty: 0, sleeper: 1, driving: 2, on_duty: 3 };
  for (const seg of segments) {
    const startMin = Number(seg[0]);
    const endMin = Number(seg[1]);
    const status = seg[2];
    const rowIndex = statusToRow[status];
    if (rowIndex === undefined) continue;
    const x1 = startX + (startMin / 60) * colWidth;
    const x2 = startX + (endMin / 60) * colWidth;
    const y = gridTop + rowIndex * rowHeight;
    const width = Math.max(2, x2 - x1);
    const height = rowHeight - 1;
    if (status === 'off_duty') ctx.fillStyle = '#20d729';
    else if (status === 'driving') ctx.fillStyle = '#0e3fe0';
    else ctx.fillStyle = '#f2fa00';
    ctx.fillRect(x1, y, width, height);
  }
  ctx.fillStyle = '#1f2937';
  ctx.font = '10px "Courier New"';
  ctx.fillText(`Remarks: ${remarks.substring(0, 70)}`, leftMargin, canvas.height - 30);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 10px "Courier New"';
  ctx.fillText(`On-duty: ${onDutyHours}h | Driving: ${drivingHours}h | Miles: ${totalMiles}`, leftMargin, canvas.height - 15);
  ctx.fillStyle = '#4b5563';
  ctx.fillText(date, canvas.width - 100, 20);
}

const LogCard = ({ log, index }) => {
  const canvasRef = useRef(null);
  useLayoutEffect(() => {
    if (canvasRef.current && log?.segments?.length) {
      drawEldGrid(canvasRef.current, log.segments, log.total_on_duty_hours, log.driving_hours, log.total_miles || 0, log.remarks, log.date);
    }
  }, [log]);

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-slate-800">Day {index + 1} – {log.date}</h3>
          {log.warning && <span className="bg-amber-100 text-amber-800 font-medium px-2.5 py-0.5 rounded-md text-xs" title={log.warning}> ⚠️ Violation</span>}
        </div>
        <span className="bg-slate-100 text-slate-600 font-mono px-2 py-1 rounded-md text-xs">{log.total_miles || 0} miles</span>
      </div>
      <div className="overflow-x-auto">
        <canvas ref={canvasRef} className="border border-slate-100 rounded-lg" style={{ width: '100%', height: 'auto' }} />
      </div>
    </div>
  );
};

export default function LogsAccordion({ logs, form }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exporting, setExporting] = useState(false);
  const hiddenCanvasesRef = useRef([]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [logs]);

  if (!logs || logs.length === 0) return null;

  // Calculate work metrics
  const totalOnDutySum = logs.reduce((sum, log) => sum + parseFloat(log.total_on_duty_hours || 0), 0);
  const baseCycleUsed = parseFloat(form?.current_cycle_used || 0);
  const totalCycleExpended = baseCycleUsed + totalOnDutySum;
  const extraHours = totalCycleExpended - 70;

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      // Synchronously generate all charts to hidden canvas references to extract base64 snapshots
      const canvasImages = hiddenCanvasesRef.current.map(canvas => {
        return canvas ? canvas.toDataURL('image/png') : null;
      });

      const doc = (
        <TripLogDocument 
          form={form} 
          tripData={{ logs }} 
          canvasImages={canvasImages} 
          totalCycleExpended={totalCycleExpended} 
          extraHours={extraHours} 
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HOS-Manifest-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="premium-card p-6 bg-white">
      {/* Hidden processing block used solely for mapping data frames to PDF images */}
      <div style={{ position: 'absolute', top: -9999, left: -9999, visibility: 'hidden' }}>
        {logs.map((log, idx) => (
          <canvas
            key={`hidden-canvas-${idx}`}
            ref={el => {
              if (el) {
                hiddenCanvasesRef.current[idx] = el;
                drawEldGrid(el, log.segments, log.total_on_duty_hours, log.driving_hours, log.total_miles || 0, log.remarks, log.date);
              }
            }}
          />
        ))}
      </div>

      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">ELD Framework Logs</h2>
          <p className="text-xs text-slate-400 mt-0.5">Calculated tracking graphs compliant with HOS directives.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Custom Slick Pagination Controls */}
          <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50/50 p-1">
            <button
              onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
              disabled={currentIndex === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
            >
              ←
            </button>
            <span className="text-xs font-mono px-3 text-slate-600">{currentIndex + 1} / {logs.length}</span>
            <button
              onClick={() => setCurrentIndex(p => Math.min(logs.length - 1, p + 1))}
              disabled={currentIndex === logs.length - 1}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
            >
              →
            </button>
          </div>

          {/* Export Action Button featuring pure React Icon configuration */}
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            title="Export Manifest to PDF"
            className="btn btn-square border-0 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl shadow-md transition-all duration-200 flex items-center justify-center h-9 w-9 min-h-0"
          >
            {exporting ? (
              <span className="loading loading-spinner loading-xs text-white"></span>
            ) : (
              <FiDownload size={16} />
            )}
          </button>
        </div>
      </div>

      <LogCard log={logs[currentIndex]} index={currentIndex} />
    </div>
  );
}