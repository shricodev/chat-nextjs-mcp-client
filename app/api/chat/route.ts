import { NextRequest, NextResponse } from "next/server";
import { Composio } from "@composio/core";
import { OpenAIProvider } from "@composio/openai";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const composio = new Composio({
  provider: new OpenAIProvider(),
});

// Here, I'm using Gmail, you can use any other integrations you want.
// Make sure to add the auth config to your .env file
const gmail_auth_config_id = process.env.GMAIL_AUTH_CONFIG_ID || "";

async function authenticateToolkit(userId: string, authConfigId: string) {
  try {
    const connectionRequest = await composio.connectedAccounts.initiate(
      userId,
      authConfigId,
    );

    console.log(
      `Visit this URL to authenticate Gmail: ${connectionRequest.redirectUrl}`,
    );

    await connectionRequest.waitForConnection(60);

    return connectionRequest.id;
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const userQuery = messages[messages.length - 1]?.content;

  if (!userQuery) {
    return NextResponse.json(
      { error: "No user query found in request" },
      { status: 400 },
    );
  }

  try {
    const userId = process.env.GMAIL ?? "";

    // Authenticate the toolkit using auth config
    const connectionId = await authenticateToolkit(
      userId,
      gmail_auth_config_id,
    );

    const connectedAccount = await composio.connectedAccounts.get(connectionId);
    console.log("Connected account:", connectedAccount);

    // Get tools for the authenticated user
    const tools = await composio.tools.get(userId, {
      // You can directly specify multiple apps like so, but doing so might
      // result in > 128 tools, but openai limits on 128 tools
      // toolkits: ["GMAIL", "SLACK"],
      //
      // Or, single apps like so:
      // toolkits: ["GMAIL"],
      //
      // Or, directly specifying actions like so:
      // tools: ["GMAIL_SEND_EMAIL", "SLACK_SENDS_A_MESSAGE_TO_A_SLACK_CHANNEL"],
      // Gmail and Linear does not cross the tool limit of 128 when combined
      // together as well
      toolkits: ["GMAIL"],
    });

    const task = userQuery;

    const fullMessages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          "You are a helpful assistant that can help with tasks and use tools.",
      },
      { role: "user", content: task },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: fullMessages,
      tools: tools,
      tool_choice: "auto",
    });
    const result = await composio.provider.handleToolCalls(userId, response);
    console.log("Tools executed successfully!");

    const aiMessage = response.choices[0].message;

    return NextResponse.json({
      role: "assistant",
      content: aiMessage.content || "Successfully executed tool call(s)",
      toolResponses: result,
    });
  } catch (err) {
    console.error("[ERROR]:", err);
    return NextResponse.json(
      { error: "Something went wrong!" },
      { status: 500 },
    );
  }
}
