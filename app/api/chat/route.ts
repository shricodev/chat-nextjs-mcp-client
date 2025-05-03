import { NextRequest, NextResponse } from "next/server";
import { initMCP, processQuery } from "@/lib/mcp-client";

const SERVER_PATH =
  "/home/shricodev/codes/work/blogs/composio/builds/mcp-client/chat-mcp-server/build/index.js";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const userQuery = messages[messages.length - 1].content;

  if (!userQuery) {
    return NextResponse.json(
      {
        error: "No query provided",
      },
      { status: 400 },
    );
  }

  try {
    await initMCP(SERVER_PATH);
    const reply = await processQuery(userQuery);

    return NextResponse.json({
      role: "assistant",
      content: reply,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        error: "Something went wrong",
      },
      { status: 500 },
    );
  }
}
