
import { GoogleGenAI } from "@google/genai";

export async function getTacticalInsight(playerHealth: number, enemyHealth: number, lastMove: string): Promise<string> {
  // Use process.env.API_KEY as per system requirements
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
  
  if (!apiKey) {
    console.warn("TACTICAL UPLINK FAILURE: API_KEY not detected in environment.");
    return "COMMUNICATIONS LINK OFFLINE: ENCRYPTION KEY REQUIRED";
  }

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
    return "TACTICAL ANALYSIS INTERRUPTED. RE-ESTABLISHING LINK...";
  }
}
