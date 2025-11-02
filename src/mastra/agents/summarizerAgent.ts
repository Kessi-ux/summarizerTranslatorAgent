import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import axios from 'axios';
import { summarizerTool, translatorTool } from "../tools/summarizer-tool";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

/** Summarize text using Google Gemini */
async function geminiSummarize(text: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: `Summarize this text concisely in 3–5 sentences:\n\n${text}`,
          },
        ],
      },
    ],
  };

  const res = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
  });

  const output =
    res.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    'No summary generated.';
  return output.trim();
}

/** Translate text using LibreTranslate public API */
async function translateText(
  text: string,
  targetLang: string
): Promise<string> {
  const res = await axios.post(
    'https://libretranslate.de/translate',
    {
      q: text,
      source: 'auto',
      target: targetLang,
      format: 'text',
    },
    { headers: { 'Content-Type': 'application/json' } }
  );

  return res.data?.translatedText || text;
}

/** The AI agent itself */
export const summarizerAgent = new Agent({
  name: 'Summarizer Agent',
  instructions: `
      You are a helpful assistant that summarizes any text the user provides
      and can optionally translate the summary into another language.

      Always:
      - Return a clear and concise summary
      - If a target language is given, translate the summary
      - Keep tone neutral and factual.
  `,
  model: 'google/gemini-2.0-flash',
  tools: {
    summarize: summarizerTool,
    translate: translatorTool,
  },

    // summarize: async (input: { text: string; language?: string }) => {
    //   const summary = await geminiSummarize(input.text);
    //   if (input.language) {
    //     const translated = await translateText(summary, input.language);
    //     return { summary, translated };
    //   }
    //   return { summary };
    // },

  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
    }),
  }),
});