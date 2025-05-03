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

export async function processQuery(query: string) {
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: query,
    },
  ];
  const response = await openai.chat.completions.create({
    model: MODEL_NAME,
    max_tokens: 1000,
    messages,
    tools,
  });

  const reply = response.choices[0].message;

  if (reply.tool_calls?.length) {
    const toolCall = reply.tool_calls[0];
    const toolName = toolCall.function.name;
    const toolArgs = JSON.parse(toolCall.function.arguments || "{}");

    const result = await mcp.callTool({
      name: toolName,
      arguments: toolArgs,
    });

    messages.push({
      role: "assistant",
      content: null,
      tool_calls: reply.tool_calls,
    });
    messages.push({
      role: "tool",
      content: result.content as string,
      tool_call_id: toolCall.id,
    });

    const response2 = await openai.chat.completions.create({
      model: MODEL_NAME,
      // max_tokens: 1000,
      messages,
    });

    console.log(messages[2].content);

    return response2.choices[0].message.content;
  }

  return reply.content || "";
}
