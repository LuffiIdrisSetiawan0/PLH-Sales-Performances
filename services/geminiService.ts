import { GoogleGenAI } from "@google/genai";
import { AggregatedData, DashboardSummary } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzePerformance = async (
  summary: DashboardSummary,
  breakdown: AggregatedData[],
  dateRange: { start: string; end: string }
): Promise<string> => {
  
  const prompt = `
    You are a Senior Revenue Manager Analyst for a high-end hotel chain.
    Analyze the following sales performance data for the period: ${dateRange.start} to ${dateRange.end}.

    **Executive Summary:**
    - Total Revenue: $${summary.totalRevenue.toLocaleString()}
    - Average Occupancy: ${summary.averageOccupancy.toFixed(2)}%
    - Top Room Type: ${summary.topPerformingRoomType}
    - Total Bookings: ${summary.totalBookings}

    **Breakdown by Room Type:**
    ${breakdown.map(b => `
    - ${b.roomType}:
      - Revenue: $${b.totalRevenue.toLocaleString()}
      - Avg OCC: ${b.averageOccupancy.toFixed(2)}%
    `).join('')}

    **Instructions:**
    1. Provide a "Deep Dive" analysis of the data. Look for correlations between room types and revenue efficiency.
    2. Identify specific underperforming areas compared to the top performers.
    3. Suggest 3 concrete, actionable strategies to improve Revenue per Available Room (RevPAR) for the next period.
    4. Use professional, executive-level language.
    5. Format the output in clean Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 32768, 
        },
      },
    });

    return response.text || "Unable to generate analysis at this time.";
  } catch (error) {
    console.error("Error analyzing data:", error);
    return "An error occurred while communicating with the AI analyst. Please ensure you have a valid API key supporting the Gemini 3 Pro model.";
  }
};
