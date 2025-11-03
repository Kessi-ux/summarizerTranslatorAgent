import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import "dotenv/config";

/* -------------------- GOOGLE GEMINI SETUP -------------------- */
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
  vertexai: false, // Using Gemini Flash directly, not Vertex AI
});

/* =============================================================
   1️⃣  SUMMARIZER TOOL - Summarizes long text using Gemini Flash
   ============================================================= */
export const summarizerTool = createTool({
  id: "summarize-text",
  description: "Summarize long text into a concise summary using Gemini Flash",
  inputSchema: z.object({
    text: z.string().describe("The text to summarize"),
  }),
  outputSchema: z.object({
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    return await summarizeText(context.text);
  },
});

/* ---------- Helper function for summarization ---------- */
async function summarizeText(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Summarize the following text in a few sentences:\n\n${text}`,
    });

    const summary = response.candidates?.[0]?.content?.parts?.[0]?.text;
    return { summary: summary || "No summary could be generated." };
  } catch (error) {
    console.error("Summarization error:", error);
    return { summary: "An error occurred while summarizing the text." };
  }
}

/* =============================================================
   2️⃣  TRANSLATOR TOOL - Translates text using LibreTranslate API
   ============================================================= */
export const translatorTool = createTool({
  id: "translate-text",
  description: "Translate text into a specified target language using LibreTranslate (no API key required)",
  inputSchema: z.object({
    text: z.string().describe("The text to translate"),
    targetLang: z.string().describe("Target language code (e.g., 'es' for Spanish, 'fr' for French, 'de' for German)"),
  }),
  outputSchema: z.object({
    translatedText: z.string(),
  }),
  execute: async ({ context }) => {
    const translated = await translateText(context.text, context.targetLang);
    return { translatedText: translated };
  },
});

/* ---------- Helper function for translation ---------- */
async function translateText(text: string, targetLang: string) {
  try {
    const response = await axios.post(
      "https://libretranslate.de/translate",
      {
        q: text,
        source: "auto",
        target: targetLang,
        format: "text",
      },
      { headers: { "Content-Type": "application/json" } }
    );

    return response.data?.translatedText;
  } catch (error: any) {
    console.error("Translation error:", error.message || error);
    return "An error occurred while translating the text.";
  }
}
