import React, { useState } from 'react';
import writeXlsxFile, { type SheetData } from 'write-excel-file/browser';
import { jsPDF } from 'jspdf';

const writeSingleSheet = writeXlsxFile as unknown as (
  data: SheetData,
  options: { fileName: string }
) => Promise<void>;
import { useSalesWorkflow } from '../context/SalesWorkflowContext';
import {
  FileSpreadsheet,
  Printer,
  Download,
  X,
  CheckCircle
} from 'lucide-react';

interface ExportReportModalProps {
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({ onClose }) => {
  const {
    totalVerifiedSales,
    totalVerifiedCollections,
    salesAchievementPct,
    closerPerformances,
    filteredVerifiedPayments,
    filter,
    effectivePeriod
  } = useSalesWorkflow();

  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadXlsx = async () => {
    const headers = ['Transaction Ref', 'Student Name', 'Program', 'Assigned Closer', 'Verified Collection', 'Payment Type', 'Verified Date', 'Verified By'];
    const rows = filteredVerifiedPayments.map((payment) => [
      payment.transactionRef,
      payment.studentName,
      payment.program,
      payment.closerName,
      payment.amount,
      payment.paymentType,
      payment.verifiedAt || payment.createdAt,
      payment.verifiedBy || ''
    ]);
    const spreadsheetData: SheetData = [headers.map((header) => ({ value: header, fontWeight: 'bold' })), ...rows];
    await writeSingleSheet(
      spreadsheetData,
      { fileName: `TMT_Verified_Sales_${new Date().toISOString().slice(0, 10)}.xlsx` }
    );

    setDownloadSuccess('Excel workbook downloaded successfully.');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleDownloadClosersXlsx = async () => {
    const headers = [
      'Rank',
      'Closer Name',
      'Title',
      'Actual Sales ($)',
      'Verified Collections ($)',
      'Monthly Target ($)',
      'Achievement (%)',
      'Deals Closed',
      'Estimated Commission ($)'
    ];

    const rows = closerPerformances.map((c) => [
      c.rank,
      `"${c.closer.name}"`,
      `"${c.closer.title}"`,
      c.actualSales,
      c.actualCollections,
      c.closer.quota.monthlyTarget,
      c.salesAchievementPct.toFixed(1),
      c.closedDealsCount,
      Math.round(c.estimatedCommissions)
    ]);

    const spreadsheetData: SheetData = [headers.map((header) => ({ value: header, fontWeight: 'bold' })), ...rows];
    await writeSingleSheet(
      spreadsheetData,
      { fileName: `TMT_Closer_Quotas_${new Date().toISOString().slice(0, 10)}.xlsx` }
    );

    setDownloadSuccess('Closer quota workbook downloaded successfully.');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleDownloadPdf = () => {
    const document = new jsPDF();
    const period = filter.dateRange === 'custom'
      ? `${filter.customStartDate || 'Start'} to ${filter.customEndDate || 'Today'}`
      : filter.dateRange.replace('_', ' ');
    const lines = [
      'TMT Sales Dashboard - Verified Sales Summary',
      `Period: ${period}`,
      `Verified Sales: $${totalVerifiedSales.toLocaleString()}`,
      `Verified Collections: $${totalVerifiedCollections.toLocaleString()}`,
      `Sales Achievement: ${salesAchievementPct.toFixed(1)}%`,
      '',
      'Closer Performance'
    ];
    closerPerformances.forEach((performance) => {
      lines.push(`${performance.closer.name}: $${performance.actualSales.toLocaleString()} sales | $${performance.actualCollections.toLocaleString()} collections | ${performance.salesAchievementPct.toFixed(1)}%`);
    });
    document.setFontSize(12);
    document.text(lines, 16, 20, { maxWidth: 178, lineHeightFactor: 1.5 });
    document.save(`TMT_Sales_Summary_${new Date().toISOString().slice(0, 10)}.pdf`);
    setDownloadSuccess('PDF summary downloaded successfully.');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Export Executive Sales &amp; Collections Reports
              </h3>
              <p className="text-xs text-slate-500">
                Generate audit-ready spreadsheets or executive PDF printable reports.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {downloadSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{downloadSuccess}</span>
          </div>
        )}

        {/* Export Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Option 1: Verified Sales CSV */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <span className="text-[10px] font-mono text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                  .XLSX
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">Sales &amp; Collections Ledger</h4>
              <p className="text-[11px] text-slate-500">
                Complete verified payment transactions, student attribution, and transaction refs.
              </p>
            </div>
            <button
              onClick={handleDownloadXlsx}
              className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Excel</span>
            </button>
          </div>

          {/* Option 2: Closer Quotas CSV */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                <span className="text-[10px] font-mono text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                  .XLSX
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">Closer Performance &amp; Quotas</h4>
              <p className="text-[11px] text-slate-500">
                Monthly targets, collections, achievement %, deals closed, and commission estimates.
              </p>
            </div>
            <button
              onClick={handleDownloadClosersXlsx}
              className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Quotas</span>
            </button>
          </div>

          {/* Option 3: Printable Executive PDF */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Printer className="h-5 w-5 text-slate-700" />
                <span className="text-[10px] font-mono text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                  Print / PDF
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">Executive Summary PDF</h4>
              <p className="text-[11px] text-slate-500">
                Optimized layout formatted for printing or saving directly as high-res PDF.
              </p>
            </div>
            <button
              onClick={handleDownloadPdf}
              className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Report Preview Summary */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-700">
          <div className="flex items-center justify-between text-slate-500 font-sans text-xs border-b border-slate-200 pb-2 mb-2 font-medium">
            <span>Executive Snapshot Summary</span>
            <span>Effective: {effectivePeriod || 'Not configured'}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 font-sans">Verified Sales</span>
              <div className="text-slate-900 font-bold">${totalVerifiedSales.toLocaleString()}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 font-sans">Verified Cash</span>
              <div className="text-emerald-700 font-bold">${totalVerifiedCollections.toLocaleString()}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 font-sans">Achievement</span>
              <div className="text-indigo-700 font-bold">{salesAchievementPct.toFixed(1)}%</div>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 font-sans">Verified Students</span>
              <div className="text-slate-900 font-bold">{new Set(filteredVerifiedPayments.map((payment) => payment.studentId)).size}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
