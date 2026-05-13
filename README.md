# Vireon AI

**Autonomous Multi-Agent Development Platform**

Vireon AI turns a natural language product idea into a planned, scaffolded, reviewed, tested, and sandboxed application.

It uses LangGraph to coordinate specialized AI agents, Google Gemini for reasoning and code generation, Docker for isolated project sandboxes, and a React dashboard for real-time mission control.

## What It Does

- Converts vague user requirements into structured product specifications.
- Asks clarification questions when the requirement is incomplete.
- Produces architecture blueprints, database models, API plans, frontend pages, and implementation tasks.
- Creates isolated full-stack sandboxes with backend, frontend, and database services.
- Runs an automated development loop with coding, review, execution, debugging, snapshots, and deployment verification.
- Streams live pipeline progress to a React dashboard through WebSockets.
- Tracks Gemini token usage and supports a configurable token budget.
- Supports checkpointing with in-memory state by default and optional Redis persistence.

## Agent Pipeline

The system is organized as a graph of specialized agents and workflow nodes:

1. **PM Agent** - turns a requirement into a clear product specification.
2. **Architect Agent** - designs entities, database schema, API endpoints, frontend pages, and folder structure.
3. **Blueprint Validator** - checks the architecture and routes failed sections back for repair.
4. **Planner Agent** - breaks the blueprint into implementation phases and tasks.
5. **Sandbox Setup** - creates a generated project workspace and prepares database, backend, and frontend services.
6. **Coder Agent** - writes project files task by task.
7. **Reviewer Agent** - reviews generated code before execution.
8. **Executor Agent** - runs commands and checks whether the generated code works.
9. **Debugger Agent** - analyzes failures and sends fixes back into the loop.
10. **Snapshot Manager** - commits successful milestones and tags versions.
11. **Deployment Verifier** - performs a final verification before presenting the result.

## Tech Stack

| Area | Technology |
| --- | --- |
| AI Orchestration | LangGraph |
| LLM | Google Gemini |
| Backend | Node.js, Express.js |
| Frontend | React, Vite, Zustand |
| Real-time Updates | WebSocket |
| Sandbox Runtime | Docker |
| Database Support | PostgreSQL, MongoDB |
| Checkpointing | LangGraph MemorySaver, optional Redis |
| Testing | Node.js test scripts |

## Project Structure

```text
.
|-- src/
|   |-- agents/              # PM, architect, planner, coder, reviewer, debugger agents
|   |-- config/              # LangGraph state and graph wiring
|   |-- nodes/               # Workflow nodes for sandboxing, review, snapshots, routing
|   |-- utils/               # Gemini wrapper, token tracking, Redis, Docker sandbox utilities
|   `-- index.js             # CLI entry point
|-- server/
|   |-- routes/              # REST API for projects and sandbox files
|   |-- services/            # Graph runner service
|   |-- ws/                  # WebSocket event streaming
|   `-- index.js             # Express server entry point
|-- dashboard/
|   `-- src/                 # React mission-control dashboard
|-- tests/                   # Graph, agent, planner, sandbox, and dev-loop tests
|-- .env.example
|-- package.json
`-- vercel.json
```

## Prerequisites

- Node.js 18 or newer
- A Gemini API key
- Docker Desktop, recommended for sandbox execution
- Redis, optional for persistent checkpointing

## Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Configure:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
REDIS_URL=
SERVER_PORT=3000
FRONTEND_URL=http://localhost:5173
TOKEN_BUDGET=2.0
```

For the dashboard, create `dashboard/.env` from `dashboard/.env.example`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

## Installation

Install backend dependencies:

```bash
npm install
```

Install dashboard dependencies:

```bash
cd dashboard
npm install
cd ..
```

## Running the App

Start the backend server and React dashboard together:

```bash
npm run dev
```

Default URLs:

- REST API: `http://localhost:3000/api`
- WebSocket: `ws://localhost:3000/ws`
- Dashboard: `http://localhost:5173`

## CLI Usage

Run a project from the terminal:

```bash
npm run cli -- "Build a todo app with categories, due dates, and authentication"
```

Or start interactive mode:

```bash
npm run cli
```

Resume a checkpointed project:

```bash
node src/index.js --resume project-1234567890
```

## Available Scripts

```bash
npm run dev              # Start Express server and React dashboard
npm run server           # Start backend API and WebSocket server
npm run dashboard        # Start dashboard only
npm run build            # Build dashboard
npm run cli              # Run CLI workflow
npm run test:graph       # Test graph wiring with mocks
npm run test:pm          # Test PM agent with Gemini
npm run test:architect   # Test architect workflow
npm run test:validator   # Test blueprint validation
npm run test:planner     # Test planning workflow
npm run test:sandbox     # Test sandbox setup
npm run test:devloop     # Test full development loop
npm run test:all:mock    # Run mock-safe tests
```

## Dashboard Features

- Start a new project from a single requirement.
- Watch live graph events and node transitions.
- View logs, generated output, and token usage.
- Answer agent clarification questions from the UI.
- Cancel, retry, or resume project runs.
- Inspect sandbox metadata and generated files through the API.

## API Overview

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Server health check |
| `POST` | `/api/projects` | Start a new project |
| `GET` | `/api/projects` | List active runs |
| `GET` | `/api/projects/:id` | Get summarized project state |
| `POST` | `/api/projects/:id/resume` | Resume a checkpointed project |
| `POST` | `/api/projects/:id/cancel` | Cancel a running project |
| `GET` | `/api/projects/:id/sandbox` | Get sandbox information and files |
| `GET` | `/api/projects/:id/files/:path` | Read a generated sandbox file |

## Resume Summary

**Vireon AI - Autonomous Multi-Agent Development Platform** is a full-stack AI system that automates requirement analysis, architecture planning, task generation, code creation, review, execution, debugging, and sandbox deployment using LangGraph, Gemini, Node.js, Docker, and React.

## Notes

- The app can run without Redis, but checkpoint persistence across restarts requires `REDIS_URL`.
- Docker is recommended for full sandbox functionality. Without Docker, sandbox features may be limited.
- Real Gemini-powered tests require a valid `GEMINI_API_KEY`.
