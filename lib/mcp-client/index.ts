import { OpenAI } from "openai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL_NAME = "gpt-4o-mini";

if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});
const mcp = new Client({ name: "nextjs-mcp-client", version: "1.0.0" });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tools: any[] = [];

let connected = false;

export async function initMCP(serverScriptPath: string) {
  if (connected) return;

  const command = serverScriptPath.endsWith(".py")
    ? process.platform === "win32"
      ? "python"
      : "python3"
    : process.execPath;

  const transport = new StdioClientTransport({
    command,
    args: [serverScriptPath, "/home/shricodev"],
  });

  mcp.connect(transport);

  const toolsResult = await mcp.listTools();

  tools = toolsResult.tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));

  connected = true;
  console.log(
    "MCP Connected with tools:",
    tools.map((t) => t.function.name),
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function executeToolCall(toolCall: any) {
  const toolName = toolCall.function.name;
  const toolArgs = JSON.parse(toolCall.function.arguments || "{}");

  const result = await mcp.callTool({
    name: toolName,
    arguments: toolArgs,
  });

  return {
    id: toolCall.id,
    name: toolName,
    arguments: toolArgs,
    result: result.content,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function processQuery(messagesInput: any[]) {
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: "You are a helpful assistant that can use tools.",
    },
    ...messagesInput,
  ];

  const response = await openai.chat.completions.create({
    model: MODEL_NAME,
    max_tokens: 1000,
    messages,
    tools,
  });

  const replyMessage = response.choices[0].message;
  const toolCalls = replyMessage.tool_calls || [];

  if (toolCalls.length > 0) {
    const toolResponses = [];

    for (const toolCall of toolCalls) {
      const toolResponse = await executeToolCall(toolCall);
      toolResponses.push(toolResponse);

      messages.push({
        role: "assistant",
        content: null,
        tool_calls: [toolCall],
      });

      messages.push({
        role: "tool",
        content: toolResponse.result as string,
        tool_call_id: toolCall.id,
      });
    }

    const followUp = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages,
    });

    return {
      reply: followUp.choices[0].message.content || "",
      toolCalls,
      toolResponses,
    };
  }

  return {
    reply: replyMessage.content || "",
    toolCalls: [],
    toolResponses: [],
  };
}
