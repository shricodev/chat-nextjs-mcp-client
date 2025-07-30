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

    const connection = await composio.toolkits.authorize(userId, "gmail");

    // NOTE: Uncomment these two lines once you've authenticated
    console.log(`Visit the URL to authorize:\n${connection.redirectUrl}`);
    await connection.waitForConnection();

    const tools = await composio.tools.get(userId, {
      // You can directly specify multiple apps like so, but doing so might
      // result in > 128 tools, but openai limits on 128 tools
      // toolkits: ["GMAIL", "SLACK"],
      //
      // Or, single apps like so:
      // tookits: ["GMAIL"],
      //
      // Or, directly specifying actions like so:
      // tools: ["GMAIL_SEND_EMAIL", "SLACK_SENDS_A_MESSAGE_TO_A_SLACK_CHANNEL"],

      // Gmail and Linear does not cross the tool limit of 128 when combined
      // together as well
      toolkits: ["GMAIL", "LINEAR"],
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

    console.log("Tool results:", result);

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
