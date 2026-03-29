
import { GoogleGenAI, Type } from "@google/genai";
import { User } from "../types";

// Refactored to use process.env.API_KEY directly and create instances per call as per guidelines.

export const getSmartMatches = async (query: string, users: User[]): Promise<string[]> => {
  if (!process.env.API_KEY) return [];

  // Create a new GoogleGenAI instance right before making an API call.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    // Access the text property directly.
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Matching Error:", error);
    return [];
  }
};

export const getSkillSuggestion = async (userBio: string): Promise<string[]> => {
    if (!process.env.API_KEY) return [];
    // Create a new GoogleGenAI instance right before making an API call.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
        // Access the text property directly.
        return JSON.parse(response.text || '[]');
    } catch (e) {
        return [];
    }
};

export const generateInviteEmail = async (inviterName: string, targetContact: string, appUrl: string): Promise<{subject: string, body: string}> => {
    const isPhone = !targetContact.includes('@');
    const defaultData = {
        subject: isPhone ? `TimeShare Invite` : `Join me on TimeShare!`,
        body: isPhone
            ? `Hi! ${inviterName} invited you to TimeShare. Join our skill-sharing hub here: ${appUrl}`
            : `Hi! ${inviterName} invited you to join TimeShare, a community where we exchange skills using time credits. Join us here: ${appUrl}`
    };

    if (!process.env.API_KEY) return defaultData;

    // Create a new GoogleGenAI instance right before making an API call.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Generate an invitation for 'TimeShare', a skill-sharing community.
            Inviter: ${inviterName}
            Target Contact: ${targetContact}
            Format: ${isPhone ? 'SMS (Short & Punchy)' : 'Email (Warm & Professional)'}
            Join Link: ${appUrl}

            Return a JSON object with 'subject' and 'body' fields.
            If it's an SMS, the subject is just a short title, but the body must be under 160 characters if possible.`,
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
        // Access the text property directly.
        return JSON.parse(response.text || JSON.stringify(defaultData));
    } catch (e) {
        return defaultData;
    }
};
