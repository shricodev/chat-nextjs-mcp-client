import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { OpenAIToolSet } from "composio-core";

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
      // You can directly specify multiple apps like so, but doing so might
      // result in > 128 tools, but openai limits on 128 tools
      // apps: ["gmail", "slack"],
      //
      // Or, single apps like so:
      // apps: ["gmail"],
      //
      // Or, directly specifying actions like so:
      // actions: ["GMAIL_SEND_EMAIL", "SLACK_SENDS_A_MESSAGE_TO_A_SLACK_CHANNEL"],

      // Gmail and Linear does not cross the tool limit of 128 when combined
      // together as well
      apps: ["gmail", "linear"],
    });
    console.log(
      `[DEBUG]: Tools length: ${tools.length}. Errors out if greater than 128`,
    );

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
      // tool_choice: "auto",
    });

    const aiMessage = response.choices[0].message;
    const toolCalls = aiMessage.tool_calls || [];

    if (toolCalls.length > 0) {
      const toolResponses = [];

      for (const toolCall of toolCalls) {
        const res = await toolset.executeToolCall(toolCall);
        toolResponses.push(res);
        console.log("[DEBUG]: Executed tool call:", res);
      }

      return NextResponse.json({
        role: "assistant",
        content: "Successfully executed tool call(s) 🎉🎉",
        toolResponses,
      });
    }

    return NextResponse.json({
      role: "assistant",
      content: aiMessage.content || "Sorry... got no response from the server",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong!" },
      { status: 500 },
    );
  }
}

// ------ For Local Server MCP connection ------
// import { NextRequest, NextResponse } from "next/server";
// import { initMCP, processQuery } from "@/lib/mcp-client";
//
// const SERVER_PATH =
//   "<built_mcp_server_path_index_js>";
//
// export async function POST(req: NextRequest) {
//   const { messages } = await req.json();
//   const userQuery = messages[messages.length - 1]?.content;
//
//   if (!userQuery) {
//     return NextResponse.json({ error: "No query provided" }, { status: 400 });
//   }
//
//   try {
//     await initMCP(SERVER_PATH);
//
//     const { reply, toolCalls, toolResponses } = await processQuery(messages);
//
//     if (toolCalls.length > 0) {
//       return NextResponse.json({
//         role: "assistant",
//         content: "Successfully executed tool call(s) 🎉🎉",
//         toolResponses,
//       });
//     }
//
//     return NextResponse.json({
//       role: "assistant",
//       content: reply,
//     });
//   } catch (err) {
//     console.error("[MCP Error]", err);
//     return NextResponse.json(
//       { error: "Something went wrong" },
//       { status: 500 },
//     );
//   }
// }
//
