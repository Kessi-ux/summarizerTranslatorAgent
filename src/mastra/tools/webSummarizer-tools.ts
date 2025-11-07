import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';

export const webSummarizerTool = createTool({
  id: 'web-summarizer',
  description: 'Fetches a webpage, extracts readable text, and summarizes it using Gemini.',
  inputSchema: z.object({
    url: z.string().url().describe('The webpage URL to summarize'),
  }),
  outputSchema: z.object({
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    const { url } = context;

    try {
      // 1️⃣ Fetch the web page
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      const html = await response.text();

      // 2️⃣ Extract text content
      const $ = cheerio.load(html);
      $('script, style, noscript').remove();
      const text = $('body').text().replace(/\s+/g, ' ').trim();

      // 3️⃣ Use Gemini to summarize the text
      const ai = new GoogleGenAI({
        apiKey: process.env.GOOGLE_API_KEY!,
        vertexai: false,
      });

      // ✅ FIXED: use models.generateContent instead of getGenerativeModel
      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Summarize this webpage text in clear and concise English: ${text.slice(0, 8000)}`,
              },
            ],
          },
        ],
      });

      const summary =
  result.candidates?.[0]?.content?.parts?.[0]?.text || 'No summary generated.';

      return { summary };
    } catch (error: any) {
      console.error('Web summarizer error:', error.message);
      return { summary: `Error summarizing URL: ${error.message}` };
    }
  },
});
