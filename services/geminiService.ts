
// Use correct imports and model versions as per Gemini API guidelines
import { GoogleGenAI, Type } from "@google/genai";
import { User } from "../types";

export const findBestMatches = async (query: string, users: User[]): Promise<string[]> => {
  // Always create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

  // Prepare a simplified list of users for the context window
  const userContext = users.map(u => ({
    id: u.id,
    name: u.name,
    skills: u.skills.map(s => `${s.name}: ${s.description}`).join(", ")
  }));

  try {
    // Using gemini-3-pro-preview for the reasoning task of matching users to a query
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `
        You are an intelligent matching agent for a skill-sharing platform.
        User Query: "${query}"

        Available Users:
        ${JSON.stringify(userContext)}

        Return the IDs of the top 3 users who best match the query based on their skills.
        Return ONLY a JSON array of strings (IDs).
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
      }
    });

    // Access text property directly (not a method)
    const text = response.text;
    if (!text) return [];

    try {
        return JSON.parse(text.trim()) as string[];
    } catch (parseError) {
        console.error("Failed to parse Gemini response as JSON", text);
        return [];
    }
  } catch (error) {
    console.error("Gemini matching failed", error);
    return [];
  }
};

export const generateProfileDescription = async (skills: string[]): Promise<string> => {
    // Create instance using the required named parameter
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    try {
        // Using gemini-3-flash-preview for basic text generation task
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Write a short, engaging 1-sentence bio for a user with these skills: ${skills.join(", ")}. Keep it professional yet friendly.`
        });
        // Access text property directly
        return response.text || "Ready to help!";
    } catch (e) {
        console.error("Gemini bio generation failed", e);
        return "Ready to help!";
    }
}
