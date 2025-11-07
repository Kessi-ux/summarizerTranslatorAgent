import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { webSummarizerTool } from '../tools/webSummarizer-tools';
import { webSummarizerAgent } from '../agents/webSummarizerAgent';

/* =============================================================
   STEP 1️⃣: Fetch and extract webpage text
   ============================================================= */
const fetchWebContent = createStep({
  id: 'fetch-web-content',
  description: 'Fetches webpage content and extracts readable text',
  inputSchema: z.object({
    url: z.string().url().describe('The webpage URL to summarize'),
  }),
  outputSchema: z.object({
    text: z.string().describe('Extracted text content from the webpage'),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error('No input data found');

    const { url } = inputData;

    // Call our tool to fetch webpage text - pass parameters directly
    const result = await (webSummarizerTool as any).execute({ url });

    // Handle potential errors and ensure we have valid text
    if (!result || !result.summary) {
      throw new Error('Failed to extract content from webpage');
    }

    return { text: result.summary };
  },
});

/* =============================================================
   STEP 2️⃣: Summarize the webpage text using Gemini
   ============================================================= */
const summarizeWebContent = createStep({
  id: 'summarize-web-content',
  description: 'Summarizes extracted webpage text using AI',
  inputSchema: z.object({
    text: z.string().describe('The extracted webpage text'),
  }),
  outputSchema: z.object({
    summary: z.string().describe('Concise summary of the webpage content'),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData) throw new Error('No text input found');
    if (!inputData.text) throw new Error('Text content is empty');

    const agent = mastra?.getAgent('webSummarizerAgent');
    if (!agent) throw new Error('webSummarizerAgent not found');

    const prompt = `Summarize the following webpage text clearly and concisely:\n\n${inputData.text}`;

    // Stream the AI agent's response
    const response = await agent.stream([
      { role: 'user', content: prompt },
    ]);

    let summary = '';
    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      summary += chunk;
    }

    // Validate we got a summary
    if (!summary.trim()) {
      throw new Error('Agent failed to generate summary');
    }

    return { summary: summary.trim() };
  },
});

/* =============================================================
   WORKFLOW: Combine steps into a complete process
   ============================================================= */
const webSummarizerWorkflow = createWorkflow({
  id: 'web-summarizer-workflow',
  inputSchema: z.object({
    url: z.string().url().describe('The webpage URL to summarize'),
  }),
  outputSchema: z.object({
    summary: z.string(),
  }),
})
  steps:[fetchWebContent, summarizeWebContent];

// Export the workflow
export { webSummarizerWorkflow };