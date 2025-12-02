import React, { useState, useEffect, useMemo } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import SummaryCards from '../components/SummaryCards';
import ChartsSection from '../components/ChartsSection';
import AIAnalyst from '../components/AIAnalyst';
import { getDashboardDataFromCSV, mapUnitNameToRoomType } from '../services/dataAdapter';
import { getFullSalesReport, getUnits, getRoomTypes } from '../services/csvData';
import { DailySalesData, AggregatedData, RoomType, DashboardSummary } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Dashboard: React.FC = () => {
  // Default to Nov 2025 since that's where the CSV data is
  const [startDate, setStartDate] = useState<string>('2025-11-01');
  const [endDate, setEndDate] = useState<string>('2025-11-30');
  const [rawData, setRawData] = useState<DailySalesData[]>([]);
  
  const DAILY_TARGET_REVENUE = 17092000;

  // Fetch daily data for charts
  useEffect(() => {
    const data = getDashboardDataFromCSV(startDate, endDate);
    setRawData(data);
  }, [startDate, endDate]);

  // Calculate Top Groups based on the selected period
  const topGroups = useMemo(() => {
    // Get all sales
    const allSales = getFullSalesReport();
    
    // Filter sales where check-in is within the selected range (Dashboard context)
    const salesInPeriod = allSales.filter(sale => 
      sale.check_in >= startDate && sale.check_in <= endDate
    );

    // Group and sum amount
    const grouped = salesInPeriod.reduce((acc, curr) => {
      acc[curr.group_name] = (acc[curr.group_name] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    // Sort and slice top 10
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [startDate, endDate]);

  // Calculate Sales Trend based on Check-in Date (Revenue at check-in)
  const salesTrendData = useMemo(() => {
    const allSales = getFullSalesReport();
    const salesInPeriod = allSales.filter(sale => 
      sale.check_in >= startDate && sale.check_in <= endDate
    );

    const grouped = salesInPeriod.reduce((acc, curr) => {
      acc[curr.check_in] = (acc[curr.check_in] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    // Fill date gaps with 0
    const filled: { date: string; amount: number }[] = [];
    const currDate = new Date(startDate);
    const lastDate = new Date(endDate);
    
    if (currDate > lastDate) return [];

    while (currDate <= lastDate) {
      const dStr = currDate.toISOString().split('T')[0];
      filled.push({
        date: dStr,
        amount: grouped[dStr] || 0
      });
      currDate.setDate(currDate.getDate() + 1);
    }
    
    return filled;
  }, [startDate, endDate]);

  // Calculate Capacity Stats
  const capacityStats = useMemo(() => {
    const units = getUnits();
    const total = units.length;
    const byType: Record<string, number> = {};
    const allRoomTypes = getRoomTypes();
    
    // Initialize
    allRoomTypes.forEach(t => byType[t] = 0);

    units.forEach(u => {
      const type = mapUnitNameToRoomType(u.name);
      if (byType[type] !== undefined) byType[type]++;
    });
    
    return { total, byType };
  }, []);

  // Aggregate Data Logic
  const aggregation = useMemo(() => {
    const grouped: Record<string, AggregatedData> = {};
    const allRoomTypes = getRoomTypes();
    let totalRev = 0;
    
    // Calculate inclusive days difference
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Handle invalid dates or start > end
    const timeDiff = (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) 
      ? Math.abs(end.getTime() - start.getTime()) 
      : 0;
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    // Initialize groups
    allRoomTypes.forEach(type => {
      grouped[type] = {
        roomType: type,
        totalRevenue: 0,
        averageOccupancy: 0,
        totalBookings: 0
      };
    });

    const occCounts: Record<string, number> = {}; // Tracks sold room nights per type

    rawData.forEach(item => {
      if (grouped[item.roomType]) {
        grouped[item.roomType].totalRevenue += item.revenue;
        // item.occupancyRate from DataAdapter is 100 for a sold room.
        // We just need to count the Sold Nights.
        occCounts[item.roomType] = (occCounts[item.roomType] || 0) + 1;
        totalRev += item.revenue;
      }
    });

    // Finalize averages based on Capacity
    // Filter out RoomTypes that have 0 revenue to keep charts clean, or keep them if you want to show 0s
    const breakdown = Object.values(grouped).map(group => {
      const typeCapacity = (capacityStats.byType[group.roomType] || 0) * daysDiff;
      const soldNights = occCounts[group.roomType] || 0;
      
      return {
        ...group,
        averageOccupancy: typeCapacity > 0 ? (soldNights / typeCapacity) * 100 : 0,
        totalBookings: soldNights // Representing Sold Room Nights
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue); // Sort by revenue descending

    // Calculate Summary
    const totalCapacity = capacityStats.total * daysDiff;
    const totalSoldNights = Object.values(occCounts).reduce((a, b) => a + b, 0);
    const avgOcc = totalCapacity > 0 ? (totalSoldNights / totalCapacity) * 100 : 0;
    
    const topPerformer = breakdown.length > 0 ? breakdown[0] : null;

    const totalTargetRevenue = daysDiff * DAILY_TARGET_REVENUE;
    const revenueVariance = totalRev - totalTargetRevenue;

    const summary: DashboardSummary = {
      totalRevenue: totalRev,
      averageOccupancy: avgOcc,
      topPerformingRoomType: topPerformer ? topPerformer.roomType : 'N/A',
      totalBookings: totalSoldNights,
      totalTargetRevenue,
      revenueVariance
    };

    return { breakdown, summary };
  }, [rawData, capacityStats, startDate, endDate]);

  const handleExportCSV = () => {
    if (rawData.length === 0) return;

    const headers = ['Date', 'Room Type', 'Revenue ($)', 'Occupancy Rate (%)'];
    const csvContent = [
      headers.join(','),
      ...rawData.map(row => 
        [
          row.date, 
          `"${row.roomType}"`,
          row.revenue.toFixed(2), 
          row.occupancyRate.toFixed(2)
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `lumina_sales_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    // Use landscape for better layout of the table and cards row
    const doc = new jsPDF({ orientation: 'landscape' });
    const summary = aggregation.summary;
    const pageWidth = doc.internal.pageSize.width;

    // --- Header ---
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text("Lembah Hijau Sales Performances - Dashboard", 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`Period: ${startDate} to ${endDate} | Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    // --- KPI Cards (Single Row, Centered) ---
    // Calculate layout for 5 cards with gaps
    const cardWidth = 50;
    const cardHeight = 25;
    const gap = 5;
    const totalRowWidth = (cardWidth * 5) + (gap * 4);
    const startX = (pageWidth - totalRowWidth) / 2;
    const startY = 30;

    const cards = [
      {
        title: "Total Revenue",
        value: `Rp ${(summary.totalRevenue / 1000000).toLocaleString(undefined, {maximumFractionDigits: 1})}M`,
        color: [5, 150, 105], // Emerald
      },
      {
        title: "Avg Occupancy",
        value: `${summary.averageOccupancy.toFixed(1)}%`,
        color: [37, 99, 235], // Blue
      },
      {
        title: "Target Revenue",
        value: `Rp ${(summary.totalTargetRevenue / 1000000).toLocaleString(undefined, {maximumFractionDigits: 1})}M`,
        color: [124, 58, 237], // Violet
      },
      {
        title: "Revenue Status",
        value: `${summary.revenueVariance >= 0 ? '+' : ''}Rp ${(summary.revenueVariance / 1000000).toLocaleString(undefined, {maximumFractionDigits: 1})}M`,
        sub: summary.revenueVariance >= 0 ? 'Surplus' : 'Shortfall',
        color: summary.revenueVariance >= 0 ? [5, 150, 105] : [225, 29, 72], // Emerald or Rose
      },
      {
        title: "Total Bookings",
        value: `${summary.totalBookings}`,
        color: [234, 88, 12], // Orange
      }
    ];

    cards.forEach((card, index) => {
      const x = startX + (index * (cardWidth + gap));
      const y = startY;

      // Card Background
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

      // Title
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(card.title.toUpperCase(), x + 3, y + 8);

      // Value
      doc.setFontSize(14);
      doc.setTextColor(card.color[0], card.color[1], card.color[2]);
      doc.setFont("helvetica", "bold");
      doc.text(card.value, x + 3, y + 18);
      doc.setFont("helvetica", "normal");

      // Sub value if exists
      if ((card as any).sub) {
        doc.setFontSize(7);
        doc.text((card as any).sub, x + 3, y + 23);
      }
    });

    // --- Sales Report Table ---
    // Fetch data matching the dashboard period
    const allSales = getFullSalesReport();
    const salesInPeriod = allSales.filter(sale => 
      sale.check_in >= startDate && sale.check_in <= endDate
    ).sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime());

    // Replace Sales ID with Sales Name (PIC Name) and remove duplicate PIC column
    const tableColumn = ["Sales Name", "Group / Guest", "Unit", "Check In", "Check Out", "Amount", "Status"];
    const tableRows = salesInPeriod.map(sale => [
      sale.pic_name,
      sale.group_name,
      sale.unit_name,
      sale.check_in,
      sale.check_out,
      `Rp ${sale.amount.toLocaleString()}`,
      sale.status
    ]);

    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("Sales Details", 14, startY + cardHeight + 15);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: startY + cardHeight + 20,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
      theme: 'grid',
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, doc.internal.pageSize.height - 10);
        doc.text("Lembah Hijau Sales Performances", 14, doc.internal.pageSize.height - 10);
    }

    doc.save(`lumina_dashboard_full_report_${startDate}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DashboardHeader 
        startDate={startDate} 
        endDate={endDate} 
        onStartDateChange={setStartDate} 
        onEndDateChange={setEndDate} 
        onExport={handleExportCSV}
        onDownloadPDF={handleDownloadPDF}
      />

      <SummaryCards summary={aggregation.summary} />

      <AIAnalyst 
        summary={aggregation.summary} 
        breakdown={aggregation.breakdown} 
        dateRange={{ start: startDate, end: endDate }}
      />

      {rawData.length === 0 ? (
        <div className="bg-white p-12 rounded-xl text-center border border-slate-100 shadow-sm text-slate-500">
          <p>No data available for the selected period.</p>
          <p className="text-sm mt-1">Try selecting November 2025.</p>
        </div>
      ) : (
        <ChartsSection 
          aggregatedData={aggregation.breakdown.slice(0, 7)} 
          dailyData={rawData} 
          topGroups={topGroups}
          salesTrendData={salesTrendData}
          capacityPerType={capacityStats.byType}
          totalCapacity={capacityStats.total}
        />
      )}
    </div>
  );
};

export default Dashboard;