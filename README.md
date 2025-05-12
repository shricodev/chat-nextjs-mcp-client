# 💬 MCP Chatbot – Composio + Local MCP servers

## 👀 Check Out My Blog Post on this Project!

> I have a blog post about this project [here](https://dev.to/composiodev/build-your-own-chat-mcp-client-with-nextjs-4a0k).

## Brief

Tired of building the same styled AI chatbot apps? This one's different.

It is a fully working chat interface built using **Next.js**, powered by
**Model Context Protocol (MCP)**, capable of connecting to both **remote and
local MCP servers**, with **tool-calling support** like **Cursor** and
**Windsurf**.

> [!NOTE]
> This is just a simple demo application designed to show you how you can
> connect to MCP servers in Next.js (Not a production ready application)

Link to the demo: [Composio hosted MCP servers](https://youtu.be/dvGf4mpnmH4), [Local filesystem MCP server](https://youtu.be/GBH_WfYu2_4)

## 🚀 Features

- 🧠 Chat interface powered by AI models
- 🔗 Support for both local and hosted MCP servers
- 🛠️ Tool calling (Gmail, Linear, Slack, etc.)
- 💅 Styled with Tailwind CSS + Shadcn UI
- ⚡ Built with App Router (Next.js 14+)

## 📦 Tech Stack

- **Next.js** (App Router, TypeScript)
- **Tailwind CSS**
- **shadcn/ui**
- **Model Context Protocol (MCP) SDK**
- **Composio API** (for hosted MCP server + integrations)

## 🛠️ Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/chat-nextjs-mcp-client.git
cd chat-nextjs-mcp-client
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure `.env`

Create a `.env` file in the root and add your Composio API key:

```env
COMPOSIO_API_KEY=<your_composio_api_key>
OPENAI_API_KEY=sk-<your_openai_api_key>
```

> 💡 You can skip this if you're only using local MCP servers.

### 4. Set up Composio CLI (for remote MCP)

```bash
sudo npm install -g composio-core
composio login

# Or, any other integrations you prefer.
composio add gmail
composio add linear
```

Confirm integrations:

```bash
composio integrations
```

### 5. Set up local file system MCP server

You are not limited to working with remotely hosted MCP servers from Composio.
You can run this application entirely with locally hosted MCP servers.

> [!NOTE]
> You can find the steps on how to set local MCP servers on the blog here: [Link](https://dev.to/composiodev/build-your-own-chat-mcp-client-with-nextjs-4a0k)

## 🧪 Run the Dev Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start chatting!

## 📁 Folder Structure

```text
.
├── app
│   ├── api
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── ui
│   ├── autoresize-textarea.tsx
│   └── chat.tsx
├── lib
│   ├── mcp-client
│   └── utils.ts
├── public
├── .env.example
├── ... (other config files)
```

## 🧠 What is MCP?

**Model Context Protocol (MCP)** is a protocol for connecting AI models to
tools and real-time data sources.

### Example Use Cases

- 📧 Send emails
- 🗂️ Create GitHub issues
- 🗓️ Schedule meetings
- 💬 Post to Slack

Read more: [modelcontextprotocol.io](https://modelcontextprotocol.io/introduction)

## 🛡️ License

This project is licensed under the MIT License. See the [LICENSE](LICENSE)
file for more details.
