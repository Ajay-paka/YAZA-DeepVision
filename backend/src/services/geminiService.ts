import { config } from '../config/env.js';
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

export async function analyzeVideo(videoPath: string) {
  const apiKey = config.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey === 'YOUR_API_KEY') {
    console.error('Gemini API Key Detection Failed. Environment variables checked: GEMINI_API_KEY, API_KEY, GOOGLE_API_KEY');
    throw new Error('Gemini API key missing. Please add your Gemini API key to the "Secrets" section in the app settings (Settings -> Secrets) with the name GEMINI_API_KEY.');
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Read video file as base64
    const videoData = fs.readFileSync(videoPath);
    const base64Video = videoData.toString('base64');

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

    // Timeout guard for Gemini analysis
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: "video/mp4",
                  data: base64Video
                }
              },
              { text: prompt }
            ]
          }
        ],
        // @ts-ignore - AbortSignal is supported but not in types
        signal: controller.signal
      });

      clearTimeout(timeoutId);

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
      const normalizedResult = {
        summary: analysisResult.summary || "",
        steps: Array.isArray(analysisResult.steps) ? analysisResult.steps : [],
        notes: Array.isArray(analysisResult.notes) ? analysisResult.notes : [],
        prompt: analysisResult.prompt || ""
      };

      return normalizedResult;
    } catch (innerError: any) {
      clearTimeout(timeoutId);
      if (innerError.name === 'AbortError') {
        throw new Error('Analysis timeout. Please try a shorter video.');
      }
      throw innerError;
    }
  } catch (error: any) {
    console.error('Gemini video analysis error:', error);
    throw new Error(`Gemini analysis failed: ${error.message}`);
  }
}
