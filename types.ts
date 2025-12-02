
export type RoomType = string;

export interface DailySalesData {
  date: string;
  revenue: number;
  occupancyRate: number; // 0 to 100
  roomType: RoomType;
}

export interface AggregatedData {
  roomType: RoomType;
  totalRevenue: number;
  averageOccupancy: number;
  totalBookings: number;
}

export interface DashboardSummary {
  totalRevenue: number;
  averageOccupancy: number;
  topPerformingRoomType: RoomType;
  totalBookings: number;
  totalTargetRevenue: number;
  revenueVariance: number;
}

// CSV Data Models
export interface Unit {
  id: number;
  name: string;
  code: string;
  rooms: number;
  pax: number;
  price: number;
}

export interface PIC {
  id: number;
  name: string;
}

export interface Sale {
  id: number;
  sales_id: number;
  group_name: string;
  pic: string | number;
  check_in: string;
  check_out: string;
  pax: number;
  status: string;
  unit_id: number;
  amount: number;
  dp_amount: number;
  created_at: string;
  // Added updated_at to match CSV data and fix usage in SalesReport
  updated_at?: string;
}

export interface SalesReportItem extends Sale {
  unit_name: string;
  pic_name: string;
  duration_nights: number;
}
