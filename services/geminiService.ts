
import { GoogleGenAI } from "@google/genai";
import { Habit, DayData } from "../types";

// Always use the API key from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates futuristic motivational insights based on habit performance data.
 */
export async function getHabitInsights(habits: Habit[], history: DayData[], stats: any): Promise<string> {
  try {
    const prompt = `
      You are an advanced AI personal optimizer in a cyberpunk future. 
      Analyze the user's habit performance and provide a short, punchy, futuristic insight.
      
      User Stats:
      - Active Habits: ${habits.map(h => h.name).join(', ')}
      - Current Streak: ${stats.streak} days
      - 7-Day Performance: ${stats.sevenDayAvg}%
      - Trend: ${stats.trend}
      
      Constraint: One sentence, max 15 words. Tone: High-tech, cold but encouraging.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Access .text property directly as per the latest SDK guidelines
    return response.text?.trim() || "NEURAL LINK ESTABLISHED. DATA STREAM STABLE.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "NEURAL CONNECTION INTERRUPTED. RETRYING SYNC...";
  }
}
