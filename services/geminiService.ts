
import { GoogleGenAI } from "@google/genai";

export async function getTacticalInsight(playerHealth: number, enemyHealth: number, lastMove: string): Promise<string> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "COMMUNICATIONS LINK OFFLINE: API KEY MISSING";

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an advanced naval tactical AI in a game of Battleship. 
      Player remaining ships: ${playerHealth}/5. 
      AI remaining ships: ${enemyHealth}/5. 
      Last event: ${lastMove}.
      Provide a brief, futuristic, one-sentence tactical commentary or taunt for the command log.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "CALCULATING NEXT MANEUVER...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "TACTICAL ANALYSIS INTERRUPTED.";
  }
}
