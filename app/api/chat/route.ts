import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { OpenAIToolSet } from "composio-core";
import { tool } from "ai";

const toolset = new OpenAIToolSet();
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
    const tools = await toolset.getTools({
      actions: ["GITHUB_GET_THE_AUTHENTICATED_USER"],
    });

    const fullMessages = [
      {
        role: "system",
        content: "You are a helpful assistant that can use tools.",
      },
      ...messages,
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: fullMessages,
      tools,
      tool_choice: "auto",
    });

    const toolResponse = await toolset.handleToolCall(response);
    console.log("toolResponse", toolResponse);

    const parsed = JSON.parse(toolResponse[0]);
    const username = parsed?.data?.login;

    return NextResponse.json({
      role: "assistant",
      content: username ?? "No login found in tool response.",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong!" },
      { status: 500 },
    );
  }
}
