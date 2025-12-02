
import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  LabelList,
} from 'recharts';
import { RotateCcw, TrendingUp, Users } from 'lucide-react';
import { AggregatedData, DailySalesData } from '../types';

export interface TopGroupData {
  name: string;
  value: number;
}

export interface SalesTrendData {
  date: string;
  amount: number;
}

interface Props {
  aggregatedData: AggregatedData[];
  dailyData: DailySalesData[];
  topGroups: TopGroupData[];
  salesTrendData: SalesTrendData[];
  capacityPerType: Record<string, number>;
  totalCapacity: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    // Helper to format date if label is a date string
    let formattedLabel = label;
    // Check if label looks like a date (YYYY-MM-DD)
    if (typeof label === 'string' && label.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const dateObj = new Date(label);
        formattedLabel = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    return (
      <div className="bg-white p-4 border border-slate-200 shadow-xl rounded-lg z-50 min-w-[200px]">
        <p className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">{formattedLabel}</p>
        
        {/* Main Value (from chart dataKey) */}
        {payload.map((p: any, index: number) => (
          <div key={index} className="flex justify-between items-center gap-4 mb-2 last:mb-0">
             <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: p.color }}></span>
                <span className="text-sm text-slate-600 font-medium">{p.name}</span>
             </div>
             <span className="text-sm font-bold text-slate-800">
                {typeof p.value === 'number' 
                  ? (p.name === 'Revenue' || p.name === 'Sales' || p.name === 'Value' ? `Rp ${p.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : p.value.toLocaleString(undefined, { maximumFractionDigits: 1 })) 
                  : p.value}
                <span className="text-slate-500 ml-0.5 text-xs font-normal">{p.unit}</span>
             </span>
          </div>
        ))}

        {/* Extended Details for Revenue Chart (AggregatedData) */}
        {(data.averageOccupancy !== undefined && data.totalBookings !== undefined) && (
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Avg Occ.</span>
              <span className="text-sm font-bold text-blue-600">{data.averageOccupancy.toFixed(1)}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Bookings</span>
              <span className="text-sm font-bold text-slate-700">{data.totalBookings}</span>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const ChartsSection: React.FC<Props> = ({ aggregatedData, dailyData, topGroups, salesTrendData, capacityPerType, totalCapacity }) => {
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);

  // Filter daily data by room type if selected
  const filteredDailyData = selectedRoomType 
    ? dailyData.filter(d => d.roomType === selectedRoomType)
    : dailyData;

  // Calculate Occupancy Trend based on Capacity
  // 1. Group sold room nights by date
  const soldByDate = filteredDailyData.reduce((acc: Record<string, number>, curr) => {
    acc[curr.date] = (acc[curr.date] || 0) + 1; // Count each entry as 1 sold night
    return acc;
  }, {});

  // 2. Determine Capacity for the trend
  const trendCapacity = selectedRoomType 
    ? (capacityPerType[selectedRoomType] || 0)
    : totalCapacity;

  // 3. Map to trend data using salesTrendData dates to ensure we cover all days, filling 0s for gaps
  const occTrendData = salesTrendData.map(dayItem => {
    const soldCount = soldByDate[dayItem.date] || 0;
    return {
      date: dayItem.date,
      avgOcc: trendCapacity > 0 ? (soldCount / trendCapacity) * 100 : 0
    };
  });

  const totalSales = salesTrendData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      
      {/* 1. Sales Trend Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Sales Trend</h3>
              <p className="text-xs text-slate-500">Revenue based on check-in date</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Sales</p>
             <p className="text-lg font-bold text-emerald-600">Rp {(totalSales / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M</p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(val) => new Date(val).getDate().toString()} 
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={12}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="amount" 
                name="Sales"
                stroke="#10b981" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Top Groups Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-violet-100 rounded-lg">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <div>
               <h3 className="text-lg font-bold text-slate-800">Top Groups</h3>
               <p className="text-xs text-slate-500">Highest revenue contributors</p>
            </div>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={topGroups} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100} 
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="value" name="Revenue" radius={[0, 4, 4, 0]} barSize={20}>
                {topGroups.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index < 3 ? '#8b5cf6' : '#cbd5e1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Occupancy Trend (Full Width) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800">Occupancy Trend</h3>
          <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
            All Rooms
          </span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={occTrendData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                fontSize={12} 
                tickFormatter={(val) => new Date(val).getDate().toString()}
                tickLine={false} 
                axisLine={false} 
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={12} 
                domain={[0, 100]} 
                tickFormatter={(val) => `${val}%`}
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="avgOcc" 
                name="Occupancy" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default ChartsSection;
