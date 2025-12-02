import React from 'react';
import { DollarSign, Percent, BedDouble, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { DashboardSummary } from '../types';

interface Props {
  summary: DashboardSummary;
}

const Card: React.FC<{ title: string; value: string | number; icon: React.ReactNode; trend?: string; color: string }> = ({ title, value, icon, trend, color }) => (
  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-full">
    <div className="flex justify-between items-start mb-2">
      <p className="text-xs sm:text-sm font-medium text-slate-500 line-clamp-1">{title}</p>
      <div className={`p-2 rounded-lg bg-opacity-10 shrink-0 ml-2 ${color.replace('text-', 'bg-')}`}>
        {React.isValidElement(icon) 
          ? React.cloneElement(icon as React.ReactElement<any>, { className: `w-4 h-4 sm:w-6 sm:h-6 ${color}` }) 
          : icon}
      </div>
    </div>
    <div>
      <h3 className="text-lg sm:text-2xl font-bold text-slate-900 truncate" title={String(value)}>{value}</h3>
      {trend && <p className={`text-[10px] sm:text-xs mt-1 sm:mt-2 ${color} font-medium`}>{trend}</p>}
    </div>
  </div>
);

const SummaryCards: React.FC<Props> = ({ summary }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-6 mb-8">
      <Card
        title="Total Revenue"
        value={`Rp ${(summary.totalRevenue / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`}
        icon={<DollarSign />}
        trend="+12.5% vs last period"
        color="text-emerald-600"
      />
      <Card
        title="Avg. Occupancy"
        value={`${summary.averageOccupancy.toFixed(1)}%`}
        icon={<Percent />}
        trend="+2.1% vs last period"
        color="text-blue-600"
      />
      <Card
        title="Target Revenue"
        value={`Rp ${(summary.totalTargetRevenue / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`}
        icon={<Target />}
        color="text-violet-600"
      />
      <Card
        title="Revenue Status"
        value={`${summary.revenueVariance >= 0 ? '+' : ''}Rp ${(summary.revenueVariance / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`}
        icon={summary.revenueVariance >= 0 ? <TrendingUp /> : <TrendingDown />}
        trend={summary.revenueVariance >= 0 ? 'Surplus' : 'Shortfall'}
        color={summary.revenueVariance >= 0 ? "text-emerald-600" : "text-rose-600"}
      />
      <Card
        title="Total Bookings"
        value={summary.totalBookings}
        icon={<BedDouble />}
        color="text-orange-600"
      />
    </div>
  );
};

export default SummaryCards;