import React from 'react';
import Sidebar from './Sidebar';
import { Menu, X, LayoutDashboard, FileText } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  activePage: 'dashboard' | 'sales_report';
  onNavigate: (page: 'dashboard' | 'sales_report') => void;
}

const Layout: React.FC<Props> = ({ children, activePage, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItemClass = (page: 'dashboard' | 'sales_report') => 
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium mb-1 cursor-pointer ${
      activePage === page 
        ? 'bg-indigo-50 text-indigo-600' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <span className="font-bold text-lg text-slate-800">Lembah Hijau Sales Performances</span>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer (Right Slide) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Sidebar Panel */}
          <div className="relative w-64 bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-lg text-slate-800">Menu</span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              <nav className="space-y-1">
                <div 
                  onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }}
                  className={navItemClass('dashboard')}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Dashboard</span>
                </div>
                <div 
                  onClick={() => { onNavigate('sales_report'); setMobileMenuOpen(false); }}
                  className={navItemClass('sales_report')}
                >
                  <FileText className="w-5 h-5" />
                  <span>Sales Report</span>
                </div>
              </nav>
            </div>

            <div className="p-4 border-t border-slate-100">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                  AD
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Admin User</p>
                  <p className="text-xs text-slate-500">Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="md:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default Layout;