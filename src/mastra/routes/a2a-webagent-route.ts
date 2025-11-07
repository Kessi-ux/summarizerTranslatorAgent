import { registerApiRoute } from "@mastra/core/server";
import { randomUUID } from "crypto";
import { webSummarizerTool } from '../tools/webSummarizer-tools';

export const a2aWebAgentRoute = registerApiRoute("/a2a/web-summarizer", {
  method: "POST",
  handler: async (c) => {
    try {
      const mastra = c.get("mastra");
      const body = await c.req.json();
      const { jsonrpc, id: requestId, params } = body;

      // Validate JSON-RPC structure
      if (jsonrpc !== "2.0" || !requestId) {
        return c.json(
          {
            jsonrpc: "2.0",
            id: requestId || null,
            error: {
              code: -32600,
              message:
                'Invalid Request: jsonrpc must be "2.0" and id is required',
            },
          },
          400
        );
      }

      const { url } = params || {};

      // Validate URL parameter
      if (!url) {
        return c.json(
          {
            jsonrpc: "2.0",
            id: requestId,
            error: {
              code: -32602,
              message: "Missing required parameter: url",
            },
          },
          400
        );
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return c.json(
          {
            jsonrpc: "2.0",
            id: requestId,
            error: {
              code: -32602,
              message: "Invalid URL format",
            },
          },
          400
        );
      }

      // Execute the web summarizer tool directly
      const result = await (webSummarizerTool as any).execute({ url });

      // Prepare output artifacts
      const artifacts = [
        {
          artifactId: randomUUID(),
          name: "webSummary",
          parts: [{ kind: "text", text: result.summary }],
        },
      ];

      // Return standard JSON-RPC response
      return c.json({
        jsonrpc: "2.0",
        id: requestId,
        result: {
          id: randomUUID(),
          contextId: randomUUID(),
          status: {
            state: "completed",
            timestamp: new Date().toISOString(),
            message: {
              kind: "message",
              messageId: randomUUID(),
              role: "agent",
              parts: [{ kind: "text", text: result.summary }],
            },
          },
          artifacts,
          history: [
            {
              kind: "message",
              role: "user",
              parts: [{ kind: "text", text: `Summarize this URL: ${url}` }],
              messageId: randomUUID(),
              taskId: randomUUID(),
            },
            {
              kind: "message",
              role: "agent",
              parts: [{ kind: "text", text: result.summary }],
              messageId: randomUUID(),
              taskId: randomUUID(),
            },
          ],
          kind: "task",
        },
      });
    } catch (err) {
      const error = err as Error;
      return c.json(
        {
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32603,
            message: "Internal error",
            data: { details: error.message },
          },
        },
        500
      );
    }
  },
});