import React, { useMemo, useState, useEffect } from 'react';
import { getFullSalesReport, getUnits, getPICs, getRoomTypes } from '../services/csvData';
import { mapUnitNameToRoomType } from '../services/dataAdapter';
import { RoomType, SalesReportItem } from '../types';
import { Calendar, Search, Filter, Check, Download, X, ArrowUp, ArrowDown, Plus, Save, ChevronDown, ChevronUp, AlertTriangle, Wallet, Users, Target, TrendingUp, TrendingDown, Hash, RefreshCcw, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const SalesReport: React.FC = () => {
  // Data State - initialized from service but mutable
  const [salesData, setSalesData] = useState<SalesReportItem[]>([]);
  
  // Load initial data
  useEffect(() => {
    setSalesData(getFullSalesReport());
  }, []);

  // Form Data Sources
  const units = useMemo(() => getUnits(), []);
  const pics = useMemo(() => getPICs(), []);
  const roomTypes = useMemo(() => getRoomTypes(), []);

  // Map for O(1) unit code lookup
  const unitCodeMap = useMemo(() => {
    const map = new Map<number, string | number>();
    units.forEach(u => map.set(u.id, u.code));
    return map;
  }, [units]);

  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter States
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<RoomType[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newSale, setNewSale] = useState({
    group_name: '',
    pic_id: '',
    unit_ids: [] as string[], // Changed to array for multi-select
    check_in: '',
    check_out: '',
    pax: 2,
    amount: 0,
    dp_amount: 0,
    status: 'DP'
  });
  
  // Unit Selector UI State
  const [isUnitSelectorOpen, setIsUnitSelectorOpen] = useState(false);
  const [unitSearch, setUnitSearch] = useState('');

  // Sort State
  const [sortConfig, setSortConfig] = useState<{ key: keyof SalesReportItem; direction: 'asc' | 'desc' } | null>(null);

  // Constants
  const DAILY_TARGET_REVENUE = 17092000;

  const toggleRoomType = (type: RoomType) => {
    setSelectedRoomTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const requestSort = (key: keyof SalesReportItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredSales = useMemo(() => {
    const filtered = salesData.filter(sale => {
      // 1. Search Filter
      const matchesSearch = 
        sale.pic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.unit_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(sale.sales_id).includes(searchTerm);

      // 2. Room Type Filter
      const saleRoomType = mapUnitNameToRoomType(sale.unit_name);
      const matchesRoomType = selectedRoomTypes.length === 0 || selectedRoomTypes.includes(saleRoomType);

      // 3. Date Range Filter
      const matchesStartDate = filterStartDate ? sale.check_in >= filterStartDate : true;
      const matchesEndDate = filterEndDate ? sale.check_in <= filterEndDate : true;

      return matchesSearch && matchesRoomType && matchesStartDate && matchesEndDate;
    });

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [salesData, searchTerm, selectedRoomTypes, sortConfig, filterStartDate, filterEndDate]);

  // Calculate KPI Data from filtered results
  const kpiData = useMemo(() => {
    // 1. Basic Sums
    const sums = filteredSales.reduce((acc, curr) => ({
      totalRevenue: acc.totalRevenue + curr.amount,
      totalNights: acc.totalNights + curr.duration_nights,
      totalPax: acc.totalPax + (curr.pax || 0),
      count: acc.count + 1
    }), { totalRevenue: 0, totalNights: 0, totalPax: 0, count: 0 });

    // 2. Date Range Calculation for Target
    let daysDiff = 1;
    
    if (filterStartDate && filterEndDate) {
       // Precise range from filter
       const start = new Date(filterStartDate);
       const end = new Date(filterEndDate);
       const timeDiff = Math.abs(end.getTime() - start.getTime());
       daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // Inclusive
    } else if (filteredSales.length > 0) {
       // Estimate range from data if no filter set
       const dates = filteredSales.flatMap(s => [new Date(s.check_in).getTime(), new Date(s.check_out).getTime()]);
       const minDate = Math.min(...dates);
       const maxDate = Math.max(...dates);
       daysDiff = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 3600 * 24)));
    } else {
       // Default fallback if no data
       daysDiff = 1;
    }

    const totalTarget = daysDiff * DAILY_TARGET_REVENUE;
    const variance = sums.totalRevenue - totalTarget;

    return {
      totalRevenue: sums.totalRevenue,
      totalPax: sums.totalPax,
      count: sums.count,
      avgPax: sums.count > 0 ? sums.totalPax / sums.count : 0,
      totalTarget,
      variance,
      daysDiff
    };
  }, [filteredSales, filterStartDate, filterEndDate]);

  const handleExportCSV = () => {
    if (filteredSales.length === 0) return;

    // Change "Sales ID" to "Sales Name" and remove duplicate PIC column
    const headers = ['Sales Name', 'Group / Guest', 'Unit', 'Check In', 'Check Out', 'Nights', 'Amount', 'DP Amount', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredSales.map(sale => 
        [
          `"${sale.pic_name}"`, // Replaces sales_id with pic_name
          `"${sale.group_name}"`,
          // Removed duplicate PIC column here
          `"${sale.unit_name}"`,
          sale.check_in,
          sale.check_out,
          sale.duration_nights,
          sale.amount,
          sale.dp_amount,
          sale.status
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `lumina_sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text("Sales Report", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 26);
    if (filterStartDate || filterEndDate) {
      doc.text(`Filter Period: ${filterStartDate || 'Any'} to ${filterEndDate || 'Any'}`, 14, 31);
    }

    // Replace ID with Sales Name and remove PIC
    const tableColumn = ["Sales Name", "Group / Guest", "Unit", "Check In", "Check Out", "Amount", "Status"];
    const tableRows = filteredSales.map(sale => [
      sale.pic_name, // Sales Name
      sale.group_name,
      // Removed PIC column
      `${sale.unit_name} (${unitCodeMap.get(sale.unit_id) || ''})`,
      sale.check_in,
      sale.check_out,
      `Rp ${sale.amount.toLocaleString()}`,
      sale.status
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
    });

    doc.save(`lumina_sales_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!newSale.group_name || newSale.unit_ids.length === 0 || !newSale.check_in || !newSale.check_out || !newSale.amount) {
      alert("Please fill in all required fields. Ensure at least one unit is selected.");
      return;
    }

    // Date validation
    if (newSale.check_out < newSale.check_in) {
      alert("Check-out date cannot be before check-in date.");
      return;
    }

    // Amount validation
    if (newSale.dp_amount > newSale.amount) {
      alert("DP Amount cannot be greater than Total Amount.");
      return;
    }

    const selectedPic = pics.find(p => p.id === Number(newSale.pic_id));
    
    // Calculate nights
    const start = new Date(newSale.check_in);
    const end = new Date(newSale.check_out);
    const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    // Split amounts across selected units
    const unitCount = newSale.unit_ids.length;
    const amountPerUnit = newSale.amount / unitCount;
    const dpPerUnit = newSale.dp_amount / unitCount;
    const paxPerUnit = Math.ceil(newSale.pax / unitCount); // Rough distribution of pax

    const newItems: SalesReportItem[] = [];
    let currentMaxId = Math.max(...salesData.map(s => s.id), 0);
    
    // Determine new Sales ID (Group ID for this batch of units)
    const currentMaxSalesId = salesData.reduce((max, curr) => (curr.sales_id > max ? curr.sales_id : max), 0);
    const newSalesId = currentMaxSalesId + 1;

    newSale.unit_ids.forEach((unitId) => {
      const selectedUnit = units.find(u => u.id === Number(unitId));
      currentMaxId += 1;

      const newItem: SalesReportItem = {
        id: currentMaxId,
        sales_id: newSalesId,
        group_name: newSale.group_name,
        pic: newSale.pic_id || 0,
        pic_name: selectedPic ? selectedPic.name : 'Unknown',
        unit_id: Number(unitId),
        unit_name: selectedUnit ? selectedUnit.name : 'Unknown Unit',
        check_in: newSale.check_in,
        check_out: newSale.check_out,
        duration_nights: nights,
        pax: paxPerUnit,
        amount: amountPerUnit,
        dp_amount: dpPerUnit,
        status: newSale.status,
        created_at: new Date().toISOString().replace('T', ' ').split('.')[0],
        updated_at: new Date().toISOString().replace('T', ' ').split('.')[0],
      };
      
      newItems.push(newItem);
    });

    setSalesData([...newItems, ...salesData]);
    setIsFormOpen(false);
    
    // Reset form
    setNewSale({
      group_name: '',
      pic_id: '',
      unit_ids: [],
      check_in: '',
      check_out: '',
      pax: 2,
      amount: 0,
      dp_amount: 0,
      status: 'DP'
    });
    setUnitSearch('');
    setIsUnitSelectorOpen(false);
  };

  const toggleUnitSelection = (unitId: string) => {
    setNewSale(prev => {
      const exists = prev.unit_ids.includes(unitId);
      let newUnitIds;
      if (exists) {
        newUnitIds = prev.unit_ids.filter(id => id !== unitId);
      } else {
        newUnitIds = [...prev.unit_ids, unitId];
      }

      // Calculate Amount based on selected units and current nights
      const selectedUnits = units.filter(u => newUnitIds.includes(String(u.id)));
      const totalBasePrice = selectedUnits.reduce((sum, u) => sum + u.price, 0);
      
      let nights = 1;
      if (prev.check_in && prev.check_out) {
        const start = new Date(prev.check_in);
        const end = new Date(prev.check_out);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
           const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
           nights = diff > 0 ? diff : 1;
        }
      }

      const newAmount = totalBasePrice * nights;

      return { 
        ...prev, 
        unit_ids: newUnitIds,
        amount: newAmount,
        dp_amount: newAmount * 0.5 // Default DP to 50%
      };
    });
  };

  // Filter units for the dropdown
  const filteredUnits = useMemo(() => {
    if (!unitSearch) return units;
    return units.filter(u => u.name.toLowerCase().includes(unitSearch.toLowerCase()));
  }, [units, unitSearch]);

  const SortIcon = ({ columnKey }: { columnKey: keyof SalesReportItem }) => {
    if (sortConfig?.key !== columnKey) return <ArrowDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-50" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-indigo-600" /> 
      : <ArrowDown className="w-3 h-3 text-indigo-600" />;
  };

  const renderSortableHeader = (label: string, key: keyof SalesReportItem) => (
    <th 
      scope="col" 
      onClick={() => requestSort(key)}
      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none"
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon columnKey={key} />
      </div>
    </th>
  );

  const activeFiltersCount = selectedRoomTypes.length;
  const hasActiveFilters = activeFiltersCount > 0 || filterStartDate !== '' || filterEndDate !== '' || searchTerm !== '';

  const clearAllFilters = () => {
    setSelectedRoomTypes([]);
    setFilterStartDate('');
    setFilterEndDate('');
    setSearchTerm('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* 1. Header & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Report</h1>
          <p className="text-slate-500 text-sm mt-0.5">Detailed transaction history</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
           <button
            onClick={() => setIsFormOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Transaction</span>
            <span className="sm:hidden">New</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Controls Panel (Search, Filter, Date) - Grouped for Better Mobile Layout */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row gap-4 lg:items-center">
        
        {/* Search */}
        <div className="relative w-full lg:flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 lg:w-auto">
           {/* Date Range */}
           <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex items-center gap-2 flex-1 sm:flex-none">
                <input 
                  type="date" 
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="bg-transparent border-none text-xs sm:text-sm text-slate-700 focus:ring-0 cursor-pointer outline-none w-full sm:w-[105px] p-0"
                  placeholder="Start"
                />
                <span className="text-slate-400">-</span>
                <input 
                  type="date" 
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="bg-transparent border-none text-xs sm:text-sm text-slate-700 focus:ring-0 cursor-pointer outline-none w-full sm:w-[105px] p-0"
                  placeholder="End"
                />
              </div>
           </div>

           <div className="flex items-center gap-2">
             {/* Filter Trigger */}
             <button
               onClick={() => setIsFilterOpen(true)}
               className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-colors min-w-[100px] ${
                 activeFiltersCount > 0 
                   ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                   : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
               }`}
             >
               <Filter className="w-4 h-4" />
               <span>Filters</span>
               {activeFiltersCount > 0 && <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{activeFiltersCount}</span>}
             </button>

             {/* Clear All - Directly visible on toolbar */}
             {hasActiveFilters && (
                <button 
                  onClick={clearAllFilters}
                  className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all"
                  title="Clear All Filters"
                >
                  <RefreshCcw className="w-4 h-4" />
                  <span className="sr-only">Reset</span>
                </button>
             )}
           </div>
        </div>
      </div>

      {/* 3. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                Rp {(kpiData.totalRevenue / 1000000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M
              </h3>
            </div>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs text-slate-500">Based on {kpiData.count} transactions</p>
        </div>

        {/* Target Revenue Card */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Target Revenue</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                 Rp {(kpiData.totalTarget / 1000000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M
              </h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            For selected {kpiData.daysDiff} day(s)
          </p>
        </div>

        {/* Accumulated Variance / Balance Card */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Revenue Status</p>
              <h3 className={`text-xl font-bold mt-1 ${kpiData.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                 {kpiData.variance >= 0 ? '+' : ''}Rp {(kpiData.variance / 1000000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M
              </h3>
            </div>
            <div className={`p-2 rounded-lg ${kpiData.variance >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
              {kpiData.variance >= 0 
                ? <TrendingUp className="w-5 h-5 text-emerald-600" /> 
                : <TrendingDown className="w-5 h-5 text-rose-600" />
              }
            </div>
          </div>
          <p className="text-xs text-slate-500">
            {kpiData.variance >= 0 ? 'Surplus above target' : 'Accumulated shortfall'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Pax</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">{kpiData.totalPax}</h3>
            </div>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
           <p className="text-xs text-slate-500">Avg {kpiData.avgPax.toFixed(1)} per transaction</p>
        </div>
      </div>

      {/* New Transaction Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsFormOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">New Transaction</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="col-span-1 md:col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Group / Guest Name *</label>
                   <input 
                      type="text" 
                      required
                      className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      value={newSale.group_name}
                      onChange={e => setNewSale({...newSale, group_name: e.target.value})}
                      placeholder="e.g. Family Gathering or John Doe"
                   />
                </div>

                <div className="col-span-1 md:col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Unit / Rooms *</label>
                   <div className="relative border border-slate-300 rounded-lg bg-white">
                      <button 
                        type="button"
                        onClick={() => setIsUnitSelectorOpen(!isUnitSelectorOpen)}
                        className="w-full text-left px-3 py-2 text-sm flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
                      >
                        <span className={newSale.unit_ids.length === 0 ? 'text-slate-500' : 'text-slate-900 font-medium'}>
                          {newSale.unit_ids.length === 0 
                            ? "Select Units / Rooms" 
                            : `${newSale.unit_ids.length} Unit${newSale.unit_ids.length > 1 ? 's' : ''} Selected`}
                        </span>
                        {isUnitSelectorOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      
                      {isUnitSelectorOpen && (
                        <div className="border-t border-slate-200 p-2 bg-slate-50 rounded-b-lg">
                          <input 
                            type="text" 
                            placeholder="Search units..." 
                            className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm mb-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={unitSearch}
                            onChange={(e) => setUnitSearch(e.target.value)}
                            autoFocus
                          />
                          <div className="max-h-60 overflow-y-auto space-y-1 p-1">
                            {filteredUnits.length > 0 ? filteredUnits.map(unit => {
                              const isSelected = newSale.unit_ids.includes(String(unit.id));
                              return (
                                <div 
                                  key={unit.id} 
                                  onClick={() => toggleUnitSelection(String(unit.id))}
                                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all border ${
                                    isSelected 
                                      ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                                      : 'bg-white border-transparent hover:bg-slate-50'
                                  }`}
                                >
                                  <div>
                                    <p className={`text-sm ${isSelected ? 'font-semibold text-indigo-900' : 'font-medium text-slate-700'}`}>
                                      {unit.name}
                                    </p>
                                    <p className={`text-xs ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`}>
                                      Code: <span className="font-mono">{unit.code}</span>
                                    </p>
                                  </div>
                                  
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                     isSelected 
                                       ? 'bg-indigo-600 border-indigo-600' 
                                       : 'border-slate-300 bg-white'
                                  }`}>
                                     {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                  </div>
                                </div>
                              );
                            }) : (
                              <div className="text-xs text-slate-500 p-4 text-center">No units found</div>
                            )}
                          </div>
                        </div>
                      )}
                   </div>
                   {newSale.unit_ids.length > 1 && (
                      <div className="mt-2 flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                        <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
                        <div>
                          <span className="font-semibold">Warning:</span> Amounts will be split across {newSale.unit_ids.length} units 
                          (Rp {(newSale.amount / newSale.unit_ids.length).toLocaleString()} each).
                        </div>
                      </div>
                   )}
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">PIC (Person in Charge)</label>
                   <select 
                      className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      value={newSale.pic_id}
                      onChange={e => setNewSale({...newSale, pic_id: e.target.value})}
                   >
                     <option value="">Select PIC</option>
                     {pics.map(pic => (
                       <option key={pic.id} value={pic.id}>{pic.name}</option>
                     ))}
                   </select>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                   <select 
                      className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      value={newSale.status}
                      onChange={e => setNewSale({...newSale, status: e.target.value})}
                   >
                     <option value="DP">DP (Down Payment)</option>
                     <option value="PAID">Paid / Lunas</option>
                     <option value="CANCEL">Cancel</option>
                   </select>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Check In *</label>
                   <input 
                      type="date" 
                      required
                      className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      value={newSale.check_in}
                      onChange={e => setNewSale({...newSale, check_in: e.target.value})}
                   />
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Check Out *</label>
                   <input 
                      type="date" 
                      required
                      min={newSale.check_in}
                      className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      value={newSale.check_out}
                      onChange={e => setNewSale({...newSale, check_out: e.target.value})}
                   />
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">
                     Total Amount (Rp) *
                   </label>
                   <input 
                      type="number" 
                      required
                      min="0"
                      className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      value={newSale.amount}
                      onChange={e => setNewSale({...newSale, amount: parseFloat(e.target.value) || 0})}
                   />
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Total DP Amount (Rp)</label>
                   <input 
                      type="number" 
                      min="0"
                      className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      value={newSale.dp_amount}
                      onChange={e => setNewSale({...newSale, dp_amount: parseFloat(e.target.value) || 0})}
                   />
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Total Pax</label>
                   <input 
                      type="number" 
                      min="1"
                      className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      value={newSale.pax}
                      onChange={e => setNewSale({...newSale, pax: parseInt(e.target.value) || 0})}
                   />
                </div>

              </div>

              <div className="mt-8 flex justify-end gap-3">
                 <button 
                   type="button"
                   onClick={() => setIsFormOpen(false)}
                   className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit"
                   className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
                 >
                   <Save className="w-4 h-4" />
                   Save Transaction
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Modal (Responsive Bottom Sheet) */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 transition-opacity backdrop-blur-sm"
            onClick={() => setIsFilterOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200">
             {/* Header */}
             <div className="flex items-center justify-between p-4 border-b border-slate-100">
               <div>
                 <h3 className="text-lg font-bold text-slate-900">Filters</h3>
                 <p className="text-xs text-slate-500">Refine your sales report</p>
               </div>
               <button 
                onClick={() => setIsFilterOpen(false)} 
                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
               >
                 <X className="w-5 h-5 text-slate-500" />
               </button>
             </div>
             
             {/* Content */}
             <div className="overflow-y-auto p-4 flex-1">
                
                {/* Room Type Section */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">Room Type</h4>
                  <div className="space-y-2">
                    {roomTypes.map((type) => (
                      <label 
                        key={type}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedRoomTypes.includes(type)
                            ? 'border-indigo-200 bg-indigo-50'
                            : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <span className={`text-sm font-medium ${selectedRoomTypes.includes(type) ? 'text-indigo-900' : 'text-slate-700'}`}>
                          {type}
                        </span>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          selectedRoomTypes.includes(type) 
                            ? 'bg-indigo-600 border-indigo-600' 
                            : 'border-slate-300 bg-white'
                        }`}>
                           <input 
                             type="checkbox" 
                             className="hidden"
                             checked={selectedRoomTypes.includes(type)}
                             onChange={() => toggleRoomType(type)}
                           />
                           {selectedRoomTypes.includes(type) && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

             </div>

             {/* Footer - Apply Button Only */}
             <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button 
                  onClick={() => setIsFilterOpen(false)} 
                  className="w-full py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-colors"
                >
                  Apply Filters
                </button>
             </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {/* Changed Header: Sales Name instead of Sales ID */}
                {renderSortableHeader('Sales Name', 'pic_name')}
                {renderSortableHeader('Group / Guest', 'group_name')}
                {/* Removed duplicate PIC column */}
                {renderSortableHeader('Unit', 'unit_name')}
                {renderSortableHeader('Check In', 'check_in')}
                {renderSortableHeader('Amount', 'amount')}
                {renderSortableHeader('DP Amount', 'dp_amount')}
                {renderSortableHeader('Status', 'status')}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="even:bg-slate-50 hover:bg-indigo-50/60 transition-colors duration-150 group">
                  {/* Changed Cell: Display PIC Name instead of Sales ID */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                     {sale.pic_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">{sale.group_name}</td>
                  {/* Removed duplicate PIC cell */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {sale.unit_name} {unitCodeMap.has(sale.unit_id) ? `(${unitCodeMap.get(sale.unit_id)})` : ''}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div className="flex flex-col">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {sale.check_in}</span>
                      <span className="text-xs text-slate-400 ml-4">to {sale.check_out} ({sale.duration_nights} nights)</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">
                    Rp {sale.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                    Rp {sale.dp_amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      sale.status === 'DP' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No transactions found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;