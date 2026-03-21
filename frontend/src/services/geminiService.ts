import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from "../types/frontend";

export async function analyzeVideoOnFrontend(videoData: string, mimeType: string): Promise<AnalysisResult> {
  // Retrieve API key inside the function to ensure it's fresh
  // Fallback to various possible injection points
  const API_KEY = 
    (process.env as any).GEMINI_API_KEY || 
    (import.meta as any).env?.GEMINI_API_KEY || 
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    "";

  if (!API_KEY || API_KEY === 'MY_GEMINI_API_KEY' || API_KEY === 'YOUR_GEMINI_API_KEY') {
    throw new Error('Gemini API key missing. Please add your Gemini API key to the "Secrets" section in the app settings (Settings -> Secrets) with the name GEMINI_API_KEY.');
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `
    Analyze the following video content.
    
    Please provide:
    1. A concise summary.
    2. Key steps or events in the video.
    3. Important notes or observations.
    4. A suggested follow-up prompt for the user.
    
    Return the result strictly in the following JSON format:
    {
      "summary": "...",
      "steps": ["step 1", "step 2", ...],
      "notes": ["note 1", "note 2", ...],
      "prompt": "..."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: videoData
              }
            },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    let text = response.text?.trim();
    
    if (!text) {
      throw new Error('Gemini returned an empty response.');
    }

    // Clean up response text in case there's markdown
    if (text.startsWith('```json')) {
      text = text.substring(7, text.length - 3).trim();
    } else if (text.startsWith('```')) {
      text = text.substring(3, text.length - 3).trim();
    }

    let analysisResult;
    try {
      analysisResult = JSON.parse(text);
    } catch (parseError) {
      throw new Error('Gemini response was not valid JSON.');
    }

    // Normalize the result
    return {
      summary: analysisResult.summary || "",
      steps: Array.isArray(analysisResult.steps) ? analysisResult.steps : [],
      notes: Array.isArray(analysisResult.notes) ? analysisResult.notes : [],
      promptOutput: analysisResult.prompt || ""
    };
  } catch (error: any) {
    console.error('Gemini video analysis error:', error);
    throw new Error(`Gemini analysis failed: ${error.message}`);
  }
}
