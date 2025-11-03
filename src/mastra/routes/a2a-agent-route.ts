import { registerApiRoute } from "@mastra/core/server";
import { randomUUID } from "crypto";

/**
 * This route allows Telex.im (or any A2A-compatible system)
 * to send a JSON-RPC request directly to your Mastra AI agent.
 *
 * Supported agents:
 *  - summarizer
 *  - translator
 */

type A2APart =
  | { kind: "text"; text: string }
  | { kind: "data"; data: unknown };

export const a2aAgentRoute = registerApiRoute("/a2a/agent/:agentId", {
  method: "POST",
  handler: async (c) => {
    try {
      const mastra = c.get("mastra");
      const agentId = c.req.param("agentId");
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

      // Get agent instance (summarizer or translator)
      const agent = mastra.getAgent(agentId);
      if (!agent) {
        return c.json(
          {
            jsonrpc: "2.0",
            id: requestId,
            error: {
              code: -32602,
              message: `Agent '${agentId}' not found. Expected: summarizer or translator.`,
            },
          },
          404
        );
      }

      const { message, messages, contextId, taskId } = params || {};
      const messagesList = message
        ? [message]
        : Array.isArray(messages)
        ? messages
        : [];

      // Convert A2A message format to Mastra message format
      const mastraMessages = messagesList.map((msg: any) => ({
        role: msg.role,
        content:
          msg.parts
            ?.map(
              (part: { kind: string; text?: string; data?: unknown }) =>
                part.kind === "text"
                  ? part.text
                  : JSON.stringify(part.data ?? "")
            )
            .join("\n") || "",
      }));

      // Run agent
      const response = await agent.generate(mastraMessages);
      const agentText = response.text || "";

      // Prepare output artifacts
      const artifacts: {
        artifactId: string;
        name: string;
        parts: A2APart[];
      }[] = [
        {
          artifactId: randomUUID(),
          name: `${agentId}Response`,
          parts: [{ kind: "text", text: agentText }],
        },
      ];

      if (response.toolResults?.length) {
        artifacts.push({
          artifactId: randomUUID(),
          name: "ToolResults",
          parts: response.toolResults.map((result) => ({
            kind: "data",
            data: result,
          })),
        });
      }

      // Build conversation history
      const history = [
        ...messagesList.map((msg: any) => ({
          kind: "message",
          role: msg.role,
          parts: msg.parts,
          messageId: msg.messageId || randomUUID(),
          taskId: msg.taskId || taskId || randomUUID(),
        })),
        {
          kind: "message",
          role: "agent",
          parts: [{ kind: "text", text: agentText }],
          messageId: randomUUID(),
          taskId: taskId || randomUUID(),
        },
      ];

      // Return standard JSON-RPC response
      return c.json({
        jsonrpc: "2.0",
        id: requestId,
        result: {
          id: taskId || randomUUID(),
          contextId: contextId || randomUUID(),
          status: {
            state: "completed",
            timestamp: new Date().toISOString(),
            message: {
              kind: "message",
              messageId: randomUUID(),
              role: "agent",
              parts: [{ kind: "text", text: agentText }],
            },
          },
          artifacts,
          history,
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
