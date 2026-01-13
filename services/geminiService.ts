
import { GoogleGenAI, Type } from "@google/genai";
import { User } from "../types";

const API_KEY = process.env.API_KEY || '';

export const getSmartMatches = async (query: string, users: User[]): Promise<string[]> => {
  if (!API_KEY) return [];

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const userContext = users.map(u => ({
    id: u.id,
    name: u.name,
    skills: u.skills.map(s => `${s.name} (${s.category})`)
  }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search Query: "${query}"\nAvailable Users: ${JSON.stringify(userContext)}\n\nRank the user IDs based on how well their skills match the search query. Return only a JSON array of user IDs.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Matching Error:", error);
    return [];
  }
};

export const getSkillSuggestion = async (userBio: string): Promise<string[]> => {
    if (!API_KEY) return [];
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Based on this user bio, suggest 3-5 specific skills they could offer to others. Bio: "${userBio}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        return JSON.parse(response.text || '[]');
    } catch (e) {
        return [];
    }
};

export const generateInviteEmail = async (inviterName: string, targetContact: string, appUrl: string): Promise<{subject: string, body: string}> => {
    const defaultData = {
        subject: `Join me on TimeShare!`,
        body: `Hi! ${inviterName} invited you to join TimeShare, a community where we exchange skills using time credits. Join us here: ${appUrl}`
    };

    if (!API_KEY) return defaultData;

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Generate an invitation for 'TimeShare', a skill-sharing community where everyone gets 40 hours of credit to start.
            The invitation is from ${inviterName} to ${targetContact}.
            You MUST include this link for them to join: ${appUrl}.
            Return a JSON object with 'subject' and 'body' fields. Keep the tone warm and professional. Make sure the link is naturally integrated into the body.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subject: { type: Type.STRING },
                        body: { type: Type.STRING }
                    },
                    required: ["subject", "body"]
                }
            }
        });
        return JSON.parse(response.text || JSON.stringify(defaultData));
    } catch (e) {
        return defaultData;
    }
};
