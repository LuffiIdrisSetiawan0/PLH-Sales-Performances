import React from 'react';
import { LayoutDashboard, FileText, Hotel } from 'lucide-react';

interface Props {
  activePage: 'dashboard' | 'sales_report';
  onNavigate: (page: 'dashboard' | 'sales_report') => void;
}

const Sidebar: React.FC<Props> = ({ activePage, onNavigate }) => {
  const navItemClass = (page: 'dashboard' | 'sales_report') => 
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium mb-1 cursor-pointer ${
      activePage === page 
        ? 'bg-indigo-50 text-indigo-600' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col z-10 hidden md:flex">
      <div className="p-6 border-b border-slate-100 flex items-center gap-2">
        <div className="bg-indigo-600 p-2 rounded-lg">
           <Hotel className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">Lembah Hijau</h1>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-6">
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Analytics</p>
          <nav>
            <div 
              onClick={() => onNavigate('dashboard')}
              className={navItemClass('dashboard')}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </div>
            <div 
              onClick={() => onNavigate('sales_report')}
              className={navItemClass('sales_report')}
            >
              <FileText className="w-5 h-5" />
              <span>Sales Report</span>
            </div>
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
            AD
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Admin User</p>
            <p className="text-xs text-slate-500">Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;