
import { DailySalesData, RoomType } from '../types';
import { getFullSalesReport } from './csvData';

export const mapUnitNameToRoomType = (name: string): RoomType => {
  return name; // Directly use the unit name from CSV as the room type
};

export const getDashboardDataFromCSV = (startDateStr: string, endDateStr: string): DailySalesData[] => {
  const sales = getFullSalesReport();
  const data: DailySalesData[] = [];
  
  const startFilter = new Date(startDateStr);
  const endFilter = new Date(endDateStr);

  sales.forEach(sale => {
    const checkIn = new Date(sale.check_in);
    const checkOut = new Date(sale.check_out);
    const roomType = mapUnitNameToRoomType(sale.unit_name);
    
    // Revenue per night
    const dailyRevenue = sale.amount / sale.duration_nights;

    // Iterate through each night of the stay
    const currentIter = new Date(checkIn);
    while (currentIter < checkOut) {
      // Only include if within selected dashboard range
      if (currentIter >= startFilter && currentIter <= endFilter) {
        data.push({
          date: currentIter.toISOString().split('T')[0],
          revenue: dailyRevenue,
          occupancyRate: 100, // 1 unit occupied fully for that night
          roomType: roomType
        });
      }
      currentIter.setDate(currentIter.getDate() + 1);
    }
  });

  return data;
};
