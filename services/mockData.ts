
import { RoomType, DailySalesData } from '../types';

// Hardcoded types for mock data fallback if needed (though app uses CSV now)
const MOCK_ROOM_TYPES = ['Standard', 'Deluxe', 'Suite', 'Presidential'];

const generateRandomData = (start: Date, end: Date): DailySalesData[] => {
  const data: DailySalesData[] = [];
  const currentDate = new Date(start);

  while (currentDate <= end) {
    // Generate data for each room type for each day
    MOCK_ROOM_TYPES.forEach((type) => {
      // Base pricing and occupancy variance logic
      let basePrice = 0;
      let occBase = 0;
      
      switch (type) {
        case 'Standard':
          basePrice = 100;
          occBase = 70;
          break;
        case 'Deluxe':
          basePrice = 180;
          occBase = 60;
          break;
        case 'Suite':
          basePrice = 350;
          occBase = 45;
          break;
        case 'Presidential':
          basePrice = 1200;
          occBase = 20;
          break;
      }

      // Add some randomness and seasonality (simulated)
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const demandMultiplier = isWeekend ? 1.2 : 0.9;
      
      const randomOccVariance = (Math.random() * 20) - 10; // +/- 10%
      const finalOcc = Math.min(100, Math.max(0, (occBase + randomOccVariance) * demandMultiplier));
      
      // Calculate revenue roughly based on occupancy * price * number of rooms (assumed constant 50 rooms per type for simplicity of visualization)
      const roomsAvailable = 50;
      const roomsSold = Math.round(roomsAvailable * (finalOcc / 100));
      const dailyRevenue = roomsSold * basePrice;

      data.push({
        date: currentDate.toISOString().split('T')[0],
        roomType: type,
        revenue: dailyRevenue,
        occupancyRate: finalOcc,
      });
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return data;
};

export const getMockData = (startDate: string, endDate: string) => {
  return generateRandomData(new Date(startDate), new Date(endDate));
};
