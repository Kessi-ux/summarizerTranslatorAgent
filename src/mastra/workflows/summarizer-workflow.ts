import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { summarizerAgent } from '../agents/summarizerAgent'; 

/* -------------------- SCHEMAS & TYPES -------------------- */

// 1. Define input schema
const SummarizerInputSchema = z.object({
  text: z.string().describe('The text to be summarized'),
  language: z
    .string()
    .optional()
    .describe("Optional language code for translation (e.g., 'es', 'fr')"),
});

// 2. Define output schema
const SummarizerOutputSchema = z.object({
  summary: z.string(),
  translatedSummary: z.string().optional(),
});

// 3. Define the step that executes the core logic
const SummarizeAndTranslateStep = createStep({
  id: 'summarize-and-translate',
  description: 'Uses the summarizer agent to summarize text and optionally translate the result.',
  
  inputSchema: SummarizerInputSchema,
  outputSchema: SummarizerOutputSchema,

  execute: async ({ inputData, mastra }) => {
    const { text, language } = inputData;
    const agentId = 'Summarizer Agent'; // Assumes agent is registered with this name/ID

    // The single, powerful step: calling the agent to decide which tools to use
    let userPrompt = `Please summarize the following text:\n\n"${text}"`;
    if (language) {
      userPrompt += `\n\nAfter summarizing, please translate the summary into: ${language}`;
    }

    // Retrieve the agent from the registry
    const agent = mastra.getAgent(agentId);
    if (!agent) {
        throw new Error(`Summarizer Agent not found. Check if it's registered with ID "${agentId}".`);
    }

    // FIX: Cast agent to 'any' to resolve the 'Property 'run' does not exist' error (ts(2339))
    const runnableAgent: any = agent; 
    
    // Use the runnableAgent to execute the run method
    const response = await runnableAgent.run([
      { role: 'user', content: userPrompt }
    ]);
    
    // We assume the response object from agent.run() contains toolOutputs when tools are executed
    // The previous casting logic is maintained here
    const { toolOutputs } = response as any; 

    // Logic to extract the structured results from the tool executions
    let summary = 'Summary not found.';
    let translatedSummary: string | undefined = undefined;

    // Check if toolOutputs exist before iterating
    if (toolOutputs) {
      for (const output of toolOutputs) {
        if (output.toolName === 'summarize') {
          // Output from the summarizerTool
          summary = output.result?.summary || 'Summary generation failed.';
        }
        if (output.toolName === 'translate') {
          // Output from the translatorTool
          translatedSummary =
            output.result?.translatedText || 'Translation failed.';
        }
      }
    }


    return {
      summary,
      translatedSummary,
    };
  },
});


/**
 * This workflow orchestrates the summarizerAgent via a single step.
 */
export const summarizerWorkflow = createWorkflow({
  id: 'summarizerWorkflow',
  description: 'Summarizes text and optionally translates the summary.',

  // 4. Use the defined schema variables
  inputSchema: SummarizerInputSchema,
  outputSchema: SummarizerOutputSchema,
})
  // 5. Chain the execution step
  .then(SummarizeAndTranslateStep)
  .commit();
