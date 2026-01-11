import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

// Gemini API Key - Your provided key
const GEMINI_API_KEY = "AIzaSyBVeo8VJ7fnxEZ0NuemVtD4zj_nO4piY7A";

const REPAIR_COST_ALGORITHM = `
COST ESTIMATION ALGORITHM (Strictly follow these brackets in ₹):
1. REPAIR LABOR RANGES:
   - Mobiles/Smartphones: ₹500 - ₹3,000
   - AC, Fridge & Heavy Appliances: ₹2,000 - ₹8,000
   - Laptops & Computing: ₹1,500 - ₹10,000
   - General Home: ₹150 - ₹1,500

2. LOGISTICS:
   - Flat ₹15-60 based on distance.
`;

const PERSONA_INSTRUCTIONS = `
DIAGNOSTIC PROTOCOL:
- Role: Technical diagnostic interface providing SHORT, CONCISE responses.
- FORMAT: Use ONLY bullet points. Maximum 2-3 sentences per bullet.
- STYLE: Be direct, use short responses, no fluff or lengthy explanations.
- CONSTRAINTS: Ask exactly 5 diagnostic questions per turn when needed.
- OUTPUT FORMAT: 5 bullet points max. No introductory text, no "I understand", no "Here are my questions".
- NO HEADERS: No bold titles or section names.
- NO OPTIONS: Do not use [Option: Label] syntax. Use plain text bullet points only.
- NO PRE-PRICE: Do not mention ANY currency or cost until sufficient information provided.
- SHORT ANSWERS: When answering, keep each point brief and actionable.

BILLING TRIGGER:
Once you have sufficient information to provide a quote, output EXACTLY one line:
BILL_BREAKDOWN: Labor: ₹[Amount], Delivery: ₹[Amount], Distance: [KM]km, Total: ₹[Sum]
`;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callWithRetry(fn: () => Promise<any>, retries = 3, backoff = 1000): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable = error.status === "RESOURCE_EXHAUSTED" || error.code === 429 || (error.status >= 500 && error.status <= 599);
    if (retries > 0 && isRetryable) {
      console.warn(`API error detected. Retrying in ${backoff}ms... (${retries} retries left)`);
      await delay(backoff);
      return callWithRetry(fn, retries - 1, backoff * 2);
    }
    throw error;
  }
}

export const getExpertResponse = async (
  history: Message[],
  currentPrompt: string,
  base64Image?: string
): Promise<{ text: string; sources?: any[] }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const modelName = 'gemini-1.5-flash-8b';
    let systemInstruction = REPAIR_COST_ALGORITHM + "\n" + PERSONA_INSTRUCTIONS;

    // Build contents from history
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Add current turn parts
    const currentParts: any[] = [{ text: currentPrompt }];
    if (base64Image) {
      currentParts.push({
        inlineData: { mimeType: 'image/jpeg', data: base64Image }
      });
    }
    contents.push({ role: 'user', parts: currentParts });

    const response: GenerateContentResponse = await callWithRetry(() => 
      ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction,
          temperature: 0.1,
        }
      })
    );

    return {
      text: response.text || "• Terminal error.\n• Protocol sync failed.\n• Retry required.\n• Session interrupted.\n• Diagnostic fail.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error: any) {
    console.error("Gemini Diagnostic Error:", error);
    if (error.status === "RESOURCE_EXHAUSTED" || error.code === 429) {
      return { text: "• System busy (Quota reached).\n• Attempting to reconnect...\n• Please wait 10 seconds.\n• High server traffic.\n• Tap submit again soon." };
    }
    return { text: "• Protocol mismatch.\n• History sync error.\n• Connection dropped.\n• Retry transmission.\n• Session reset." };
  }
};

export interface VisualSearchSummary {
  productType: string;
  description: string;
  suggestedShops: any[];
  category: string;
  estimate: string;
  deliveryFee: string;
  distance: string;
  severity: 'Minor' | 'Moderate' | 'Major';
  image: string;
}

export const performVisualSearch = async (
  base64Image: string
): Promise<VisualSearchSummary> => {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const response = await callWithRetry(() =>
    ai.models.generateContent({
      model: 'gemini-1.5-flash-8b',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Hardware ID and failure analysis." }
        ]
      },
      config: {
        systemInstruction: REPAIR_COST_ALGORITHM,
      }
    })
  );

  const text = response.text || "";
  return {
    productType: "Identified Hardware",
    description: text,
    suggestedShops: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
    category: 'Hardware',
    estimate: "₹500",
    deliveryFee: "₹15",
    distance: "1.0 km",
    severity: 'Moderate',
    image: base64Image
  };
};
