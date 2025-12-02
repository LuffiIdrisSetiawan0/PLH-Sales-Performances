
import { Unit, PIC, Sale, SalesReportItem } from '../types';

// Raw CSV Data
const UNITS_CSV = `id,name,code,rooms,pax,price,created_at,updated_at
1,"Hotel Standard Twin",118,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
2,"Hotel Standard Twin",119,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
3,"Hotel Standard Twin",120,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
4,"Hotel Standard Twin",121,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
5,"Hotel Standard Twin",122,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
6,"Hotel Standard Twin",123,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
7,"Hotel Standard Twin",124,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
8,"Hotel Standard Twin",125,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
9,"Hotel Standard Twin",126,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
10,"Hotel Standard Twin",127,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
11,"Hotel Standard Twin",228,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
12,"Hotel Standard Twin",229,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
13,"Hotel Standard Twin",230,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
14,"Hotel Standard Twin",231,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
15,"Hotel Standard Twin",232,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
16,"Hotel Standard Twin",234,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
17,"Hotel Standard Twin",235,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
18,"Hotel Standard Twin",236,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
19,"Hotel Standard Twin",337,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
20,"Hotel Standard Twin",338,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
21,"Hotel Standard Twin",339,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
22,"Hotel Standard Twin",340,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
23,"Hotel Standard Twin",341,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
24,"Hotel Standard Twin",343,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
25,"Hotel Standard Twin",344,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
26,"Hotel Standard Twin",445,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
27,"Hotel Standard Twin",446,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
28,"Hotel Standard Twin",447,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
29,"Hotel Standard Twin",448,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
30,"Hotel Standard Twin",449,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
31,"Hotel Standard Twin",450,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
32,"Hotel Standard Twin",451,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
33,"Hotel Standard Twin",452,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
34,"Hotel Standard Twin",453,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
35,"Hotel Standard Twin",454,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
36,"Hotel Standard Twin",555,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
37,"Hotel Standard Twin",556,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
38,"Hotel Standard Twin",557,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
39,"Hotel Standard Twin",558,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
40,"Hotel Standard Twin",560,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
41,"Hotel Standard Twin",561,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
42,"Hotel Standard Twin",562,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
43,"Hotel Standard Twin",563,1,2,750000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
44,"Hotel Superior Twin",223,1,2,920000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
45,"Hotel Superior Twin",342,1,2,920000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
46,"Hotel Superior Twin",559,1,2,920000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
47,"Hotel Middle Standard",A,1,2,830000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
48,"Hotel Middle Standard",B,1,2,830000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
49,"Hotel Middle Standard",C,1,2,830000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
50,"Hotel Middle Standard",D,1,2,830000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
51,"Triple Hotel Standard",1100,1,3,950000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
52,"Triple Hotel Standard",1101,1,3,950000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
53,"Triple Hotel Standard",1102,1,3,950000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
54,"Triple Hotel Standard",1104,1,3,950000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
55,"Triple Hotel Standard",1105,1,3,950000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
56,"Triple Hotel Standard",1106,1,3,950000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
57,"Triple Hotel Standard",1107,1,3,950000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
58,"Triple Hotel Standard",1108,1,3,950000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
59,"Triple Hotel Standard",1209,1,3,950000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
60,"Triple Hotel Standard",1210,1,3,950000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
61,"Triple Hotel Standard",1211,1,3,950000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
62,"Triple Hotel Standard",1212,1,3,950000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
63,"Triple Hotel Standard",1214,1,3,950000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
64,"Triple Hotel Standard",1215,1,3,950000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
65,"Triple Hotel Standard",1216,1,3,950000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
66,"Triple Hotel Standard",1217,1,3,950000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
67,"Bungalow 2 kamar Standard Twin",2102,2,4,1450000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
68,"Bungalow 2 kamar Standard Twin",2202,2,4,1450000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
69,"Bungalow 2 kamar Standard Twin",2302,2,4,1450000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
70,"Bungalow 2 kamar Standard Twin",2402,2,4,1450000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
71,"Bungalow 3 kamar Standard Twin",005,3,6,2185000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
72,"Bungalow 3 kamar Standard Twin",1803,3,6,2185000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
73,"Bungalow 3 kamar Standard Twin",1903,3,6,2185000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
74,"Bungalow 3 kamar Superior Twin (japandi)",103,3,6,2875000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
75,"Bungalow 3 kamar Superior Twin (japandi)",203,3,6,2875000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
76,"Bungalow 3 kamar Superior Twin (japandi)",303,3,6,2875000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
77,"Bungalow 3 kamar Superior Twin (japandi)",403,3,6,2875000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
78,"Bungalow 3 kamar Superior Twin (japandi)",503,3,6,2875000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
79,"Bungalow 3 kamar Superior Twin (japandi)",603,3,6,2875000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
80,"Bungalow 3 kamar Superior Twin (japandi)",703,3,6,2875000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
81,"Bungalow 3 kamar Superior Twin (japandi)",803,3,6,2875000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
82,"Bungalow 3 kamar Superior Twin (japandi)",903,3,6,2875000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
83,"Bungalow 3 kamar Superior Twin (japandi)",1003,3,6,2875000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
84,"Bungalow 3 kamar Superior Twin (japandi)",1103,3,6,2875000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
85,"Bungalow 3 kamar Deluxe Twin",1203,3,6,2875000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
86,"Bungalow 3 kamar Deluxe Twin",1403,3,6,2875000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
87,"Bungalow 3 kamar Deluxe Twin",1503,3,6,2875000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
88,"Bungalow 3 kamar Deluxe Twin",1603,3,6,2875000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
89,"Bungalow 4 kamar Standard Twin",2004,4,8,2300000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
90,"Bungalow 5 Executive Deluxe Twin",006,5,10,5345000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
91,"Bungalow 5 Executive Deluxe Twin",007,5,10,5345000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
92,"Bungalow 5 Executive Suite Deluxe / Cattelya",Cattelya,5,10,5250000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
93,"Bungalow 7 Executive Deluxe Twin",008,7,14,6325000.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"
94,"Bungalow 6 Kamar Executive Deluxe (New America Style)",009,6,12,8177506.00,"2025-11-25 10:57:39","2025-11-25 10:57:39"`;

const PICS_CSV = `id,name,created_at,updated_at
1,"Budi Suhaeli","2025-11-25 14:30:15","2025-11-25 14:30:15"
2,"Deasy Ratnaningsih","2025-11-25 14:30:15","2025-11-25 14:30:15"
3,Rahma,"2025-11-25 14:30:15","2025-11-25 14:30:15"
4,Resti,"2025-11-25 14:30:15","2025-11-25 14:30:15"
5,"Andhi Eka","2025-11-25 14:30:15","2025-11-25 14:30:15"`;

const SALES_CSV = `id,group,pic,check_in,check_out,pax,sales_id,status,unit_id,amount,dp_amount,created_at,updated_at
1,1,121,2025-11-26,2025-11-28,20,2,DP,70,2900000.00,50000.00,"2025-11-25 09:05:56","2025-11-26 03:12:48"
2,BRI,Raka,2025-11-28,2025-12-01,50,2,DP,85,55000000.00,10000000.00,"2025-11-26 07:39:34","2025-11-26 07:41:05"`;

// Parsing Helper
const parseCSV = <T>(csv: string): T[] => {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    // Handle quoted strings which might contain commas
    const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
    // Simple split for this specific dataset since it's relatively clean, but let's be careful
    // We will use a basic quote aware splitter or just simple regex matching
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    const obj: any = {};
    headers.forEach((header, index) => {
      let val = values[index]?.trim();
      if (val && val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      
      // Attempt numeric conversion
      if (!isNaN(Number(val)) && val !== '') {
        obj[header] = Number(val);
      } else {
        obj[header] = val;
      }
    });
    return obj as T;
  });
};

export const getUnits = (): Unit[] => parseCSV<Unit>(UNITS_CSV);
export const getPICs = (): PIC[] => parseCSV<PIC>(PICS_CSV);
export const getSales = (): Sale[] => {
  // Manual mapping because the header says "group" but interface has "group_name"
  const raw = parseCSV<any>(SALES_CSV);
  return raw.map(r => ({
    ...r,
    group_name: r.group,
    amount: Number(r.amount), // Ensure number
  }));
};

export const getRoomTypes = (): string[] => {
  const units = getUnits();
  // Get distinct unit names
  return Array.from(new Set(units.map(u => u.name))).sort();
};

export const getFullSalesReport = (): SalesReportItem[] => {
  const units = getUnits();
  const pics = getPICs();
  const sales = getSales();

  return sales.map(sale => {
    const unit = units.find(u => u.id === sale.unit_id);
    const pic = pics.find(p => p.id === Number(sale.pic));
    
    const start = new Date(sale.check_in);
    const end = new Date(sale.check_out);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    return {
      ...sale,
      unit_name: unit ? unit.name : `Unknown Unit (${sale.unit_id})`,
      pic_name: pic ? pic.name : String(sale.pic), // Fallback to raw value if not found in PIC list (e.g. 'Raka', '121')
      duration_nights: nights > 0 ? nights : 1
    };
  });
};
