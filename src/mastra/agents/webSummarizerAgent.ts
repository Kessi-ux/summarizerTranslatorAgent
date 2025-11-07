import { Agent } from '@mastra/core/agent';
import { webSummarizerTool } from "../tools/webSummarizer-tools";

export const webSummarizerAgent = new Agent({
  name: "Web Summarizer Agent",
  instructions: `
    You are an AI assistant that summarizes webpages clearly and concisely.
    Focus on giving a neutral, informative summary of the webpage’s main content.
  `,
  model: "google/gemini-2.0-flash",
  tools: { webSummarizerTool },
});