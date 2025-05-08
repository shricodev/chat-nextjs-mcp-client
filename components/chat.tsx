"use client";

import { useState } from "react";
import { ArrowUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AutoResizeTextarea } from "@/components/autoresize-textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Message = {
  role: "user" | "assistant";
  content: string | object;
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  toolResponses?: any[];
};

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Add a temp loading msg for AI
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Hang on..." },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await res.json();
      const content =
        typeof data?.content === "string"
          ? data.content
          : "Sorry... got no response from the server";

      const toolResponses = Array.isArray(data?.toolResponses)
        ? data.toolResponses
        : [];

      setMessages((prev) => [
        ...prev.slice(0, -1), // remove the loading message
        { role: "assistant", content, toolResponses },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Oops! Something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  return (
    <main className="ring-none mx-auto flex h-svh max-h-svh w-full max-w-[35rem] flex-col items-stretch border-none">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <header className="m-auto flex max-w-96 flex-col gap-5 text-center">
            <h1 className="text-2xl font-semibold leading-none tracking-tight">
              Basic AI Chatbot Template
            </h1>
            <p className="text-muted-foreground text-sm">
              This is an AI chatbot app built with{" "}
              <span className="text-foreground">Next.js</span>,{" "}
              <span className="text-foreground">MCP backend</span>
            </p>
            <p className="text-muted-foreground text-sm">
              Built with 🤍 by Shrijal Acharya (@shricodev)
            </p>
          </header>
        ) : (
          <div className="my-4 flex h-fit min-h-full flex-col gap-4">
            {messages.map((message, index) => (
              <div key={index} className="flex flex-col gap-2">
                {message.role === "assistant" &&
                  Array.isArray(message.toolResponses) &&
                  message.toolResponses.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Tool Responses
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Accordion type="multiple" className="w-full">
                          {message.toolResponses.map((toolRes, i) => (
                            <AccordionItem key={i} value={`item-${i}`}>
                              <AccordionTrigger>
                                Tool Call #{i + 1}
                              </AccordionTrigger>
                              <AccordionContent>
                                <pre className="whitespace-pre-wrap break-words text-sm">
                                  {JSON.stringify(toolRes, null, 2)}
                                </pre>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  )}

                <div
                  className="max-w-[80%] rounded-xl px-3 py-2 text-sm data-[role=assistant]:self-start data-[role=user]:self-end"
                  data-role={message.role}
                  style={{
                    alignSelf:
                      message.role === "user" ? "flex-end" : "flex-start",
                    backgroundColor:
                      message.role === "user" ? "#3b82f6" : "#f3f4f6",
                    color: message.role === "user" ? "white" : "black",
                  }}
                >
                  {typeof message.content === "string"
                    ? message.content
                    : JSON.stringify(message.content, null, 2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-input bg-background focus-within:ring-ring/10 relative mx-6 mb-6 flex items-center rounded-[16px] border px-3 py-1.5 pr-8 text-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-0"
      >
        <AutoResizeTextarea
          onKeyDown={handleKeyDown}
          onChange={(e) => setInput(e)}
          value={input}
          placeholder="Enter a message"
          className="placeholder:text-muted-foreground flex-1 bg-transparent focus:outline-none"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute bottom-1 right-1 size-6 rounded-full"
              disabled={!input.trim() || loading}
            >
              <ArrowUpIcon size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent sideOffset={12}>Submit</TooltipContent>
        </Tooltip>
      </form>
    </main>
  );
}
