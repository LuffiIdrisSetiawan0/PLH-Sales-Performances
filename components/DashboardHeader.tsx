import React from 'react';
import { Calendar, Download, FileText } from 'lucide-react';

interface Props {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onExport: () => void;
  onDownloadPDF?: () => void;
}

const DashboardHeader: React.FC<Props> = ({ startDate, endDate, onStartDateChange, onEndDateChange, onExport, onDownloadPDF }) => {
  
  // Helper to format dates consistently with the input type="date"
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const handleRangeSelect = (range: 'last7' | 'last30' | 'thisMonth') => {
    const end = new Date();
    const start = new Date();
    
    if (range === 'last7') {
      start.setDate(end.getDate() - 6);
    } else if (range === 'last30') {
      start.setDate(end.getDate() - 29);
    } else if (range === 'thisMonth') {
      start.setDate(1);
    }
    
    onEndDateChange(formatDate(end));
    onStartDateChange(formatDate(start));
  };

  // Check active state
  const isActive = (range: 'last7' | 'last30' | 'thisMonth') => {
    const end = new Date();
    const start = new Date();
    
    if (range === 'last7') {
      start.setDate(end.getDate() - 6);
    } else if (range === 'last30') {
      start.setDate(end.getDate() - 29);
    } else if (range === 'thisMonth') {
      start.setDate(1);
    }
    
    const sStr = formatDate(start);
    const eStr = formatDate(end);
    
    return startDate === sStr && endDate === eStr;
  };

  const getButtonClass = (range: 'last7' | 'last30' | 'thisMonth') => {
    const active = isActive(range);
    const base = "flex-1 sm:flex-none px-3 py-2 text-xs font-medium rounded-md transition-all shadow-sm text-center whitespace-nowrap";
    return active 
      ? `${base} bg-white text-indigo-600 ring-1 ring-slate-200 shadow` 
      : `${base} text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm`;
  };

  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Performance</h1>
        <p className="text-slate-500 text-sm mt-1">Monitor Occupancy and Revenue metrics</p>
      </div>

      <div className="flex flex-col gap-4 w-full xl:w-auto">
        
        {/* Quick Range Selectors */}
        <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto w-full sm:w-auto">
          <button 
            onClick={() => handleRangeSelect('last7')}
            className={getButtonClass('last7')}
          >
            Last 7 Days
          </button>
          <button 
            onClick={() => handleRangeSelect('last30')}
            className={getButtonClass('last30')}
          >
            Last 30 Days
          </button>
          <button 
            onClick={() => handleRangeSelect('thisMonth')}
            className={getButtonClass('thisMonth')}
          >
            This Month
          </button>
        </div>

        {/* Date Inputs and Export Button */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 flex-grow sm:flex-grow-0 min-w-0">
            <Calendar className="w-5 h-5 text-slate-400 ml-1 shrink-0" />
            <div className="flex items-center gap-2 overflow-hidden">
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="bg-transparent border-none text-xs sm:text-sm text-slate-700 focus:ring-0 cursor-pointer outline-none w-full min-w-[90px]"
              />
              <span className="text-slate-400 shrink-0">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="bg-transparent border-none text-xs sm:text-sm text-slate-700 focus:ring-0 cursor-pointer outline-none w-full min-w-[90px]"
              />
            </div>
          </div>
          
          <button
            onClick={onExport}
            className="flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm h-[42px]"
            title="Export Raw Data to CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          
          {onDownloadPDF && (
            <button
              onClick={onDownloadPDF}
              className="flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-sm h-[42px]"
              title="Download PDF Report"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;