/**
 * App.jsx — Mission Control Dashboard
 * 
 * Industrial dark UI. No emojis. Clean typography.
 * Layout: header -> requirement bar -> pipeline -> columns (log | output) -> token bar
 */

import { useState, useCallback } from "react";
import useProjectStore from "./store/projectStore";
import useWebSocket from "./hooks/useWebSocket";
import { createProject, resumeProject } from "./lib/api";
import PipelineVisualizer from "./components/PipelineVisualizer";
import LogStream from "./components/LogStream";
import OutputPanel from "./components/OutputPanel";
import HumanInputPanel from "./components/HumanInputPanel";
import TokenBudgetBar from "./components/TokenBudgetBar";

const PUBLIC_PAGES = [
  { key: "launch", label: "Launch" },
  { key: "agents", label: "Agents" },
  { key: "sandbox", label: "Sandbox" },
  { key: "console", label: "Console" },
];

const AGENTS = [
  ["01", "PM Agent", "Clarifies the requirement and creates a product specification."],
  ["02", "Architect", "Designs entities, schemas, endpoints, pages, and structure."],
  ["03", "Planner", "Converts the blueprint into ordered build tasks."],
  ["04", "Coder", "Writes files inside the generated sandbox workspace."],
  ["05", "Reviewer", "Checks generated code before it is executed."],
  ["06", "Executor", "Runs commands and reports pass or fail signals."],
  ["07", "Debugger", "Turns failures into targeted repair attempts."],
];

export default function App() {
  const [requirementInput, setRequirementInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [activePage, setActivePage] = useState("launch");

  const projectId = useProjectStore((s) => s.projectId);
  const requirement = useProjectStore((s) => s.requirement);
  const status = useProjectStore((s) => s.status);
  const wsConnected = useProjectStore((s) => s.wsConnected);
  const humanInputRequest = useProjectStore((s) => s.humanInputRequest);
  const error = useProjectStore((s) => s.error);
  const errorRecoverable = useProjectStore((s) => s.errorRecoverable);
  const setProject = useProjectStore((s) => s.setProject);
  const reset = useProjectStore((s) => s.reset);

  const { sendMessage, disconnect } = useWebSocket(projectId);

  const handleStart = useCallback(async () => {
    if (!requirementInput.trim()) return;
    setIsStarting(true);
    try {
      const result = await createProject(requirementInput.trim());
      setProject(result.projectId, requirementInput.trim());
      setRequirementInput("");
    } catch (e) {
      alert(`Failed to start project: ${e.message}`);
    } finally {
      setIsStarting(false);
    }
  }, [requirementInput, setProject]);

  const handleHumanResponse = useCallback(
    (data) => {
      sendMessage({ type: "human_response", data });
      useProjectStore.setState({ status: "running", humanInputRequest: null });
    },
    [sendMessage]
  );

  const handleCancel = useCallback(() => {
    sendMessage({ type: "cancel" });
  }, [sendMessage]);

  const handleResume = useCallback(async () => {
    if (!projectId) return;
    try {
      useProjectStore.setState({ status: "running", error: null, errorRecoverable: false });
      await resumeProject(projectId);
    } catch (e) {
      useProjectStore.setState({ status: "error", error: `Resume failed: ${e.message}` });
    }
  }, [projectId]);

  const handleNewProject = useCallback(() => {
    disconnect();
    reset();
  }, [disconnect, reset]);

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-mark">V</span>
            <span className="logo-text">VIREON</span>
          </div>
          <span className="header-divider" />
          <span className="header-label">autonomous build console</span>
        </div>
        <div className="header-right">
          {!projectId && (
            <nav className="top-nav" aria-label="Main navigation">
              {PUBLIC_PAGES.map((page) => (
                <button
                  key={page.key}
                  className={`nav-btn ${activePage === page.key ? "nav-btn--active" : ""}`}
                  onClick={() => setActivePage(page.key)}
                >
                  {page.label}
                </button>
              ))}
            </nav>
          )}
          <div className="conn-indicator">
            <span className={`conn-dot ${wsConnected ? "live" : ""}`} />
            <span className="conn-label">{wsConnected ? "CONNECTED" : "OFFLINE"}</span>
          </div>
          {projectId && (
            <button className="btn btn-text" onClick={handleNewProject}>
              NEW PROJECT
            </button>
          )}
        </div>
      </header>

      <main className="main">
        {!projectId ? (
          <PublicShell
            activePage={activePage}
            setActivePage={setActivePage}
            requirementInput={requirementInput}
            setRequirementInput={setRequirementInput}
            isStarting={isStarting}
            handleStart={handleStart}
          />
        ) : (
          <div className="dashboard">
            <div className="req-bar">
              <div className="req-bar-left">
                <span className="req-label">TARGET</span>
                <span className="req-text">{requirement}</span>
              </div>
              <div className="req-bar-right">
                <span className={`status-pill status--${status}`}>
                  {status === "running" && "RUNNING"}
                  {status === "waiting_input" && "AWAITING INPUT"}
                  {status === "complete" && "COMPLETE"}
                  {status === "error" && "ERROR"}
                  {status === "cancelled" && "CANCELLED"}
                  {status === "idle" && "IDLE"}
                </span>
                {status === "running" && (
                  <button className="btn btn-text btn-sm" onClick={handleCancel}>
                    ABORT
                  </button>
                )}
                {status === "error" && errorRecoverable && (
                  <button className="btn btn-accent btn-sm" onClick={handleResume}>
                    RETRY
                  </button>
                )}
              </div>
            </div>

            {status === "error" && error && (
              <div className="error-bar">
                <span className="error-bar-label">ERROR</span>
                <span className="error-bar-msg">{error}</span>
                {errorRecoverable && (
                  <span className="error-bar-hint">Checkpointed. Click RETRY to resume from last good state.</span>
                )}
              </div>
            )}

            <PipelineVisualizer />

            <div className="dashboard-grid">
              <div className="dashboard-col">
                <LogStream />
              </div>
              <div className="dashboard-col">
                <OutputPanel />
              </div>
            </div>

            {humanInputRequest && (
              <HumanInputPanel
                request={humanInputRequest}
                onSubmit={handleHumanResponse}
              />
            )}

            <TokenBudgetBar />
          </div>
        )}
      </main>
    </div>
  );
}

function PublicShell({
  activePage,
  setActivePage,
  requirementInput,
  setRequirementInput,
  isStarting,
  handleStart,
}) {
  return (
    <div className="public-shell">
      {activePage === "launch" && (
        <LaunchPage
          setActivePage={setActivePage}
          requirementInput={requirementInput}
          setRequirementInput={setRequirementInput}
          isStarting={isStarting}
          handleStart={handleStart}
        />
      )}
      {activePage === "agents" && <AgentsPage setActivePage={setActivePage} />}
      {activePage === "sandbox" && <SandboxPage setActivePage={setActivePage} />}
      {activePage === "console" && <ConsolePage setActivePage={setActivePage} />}
    </div>
  );
}

function LaunchPage({
  setActivePage,
  requirementInput,
  setRequirementInput,
  isStarting,
  handleStart,
}) {
  return (
    <section className="landing landing--launch">
      <div className="hero-visual" aria-hidden="true">
        <div className="orbit orbit--one" />
        <div className="orbit orbit--two" />
        <div className="core-node">V</div>
        <div className="radar-line" />
      </div>

      <div className="landing-inner">
        <div className="landing-left">
          <p className="landing-pre">VIREON AI</p>
          <h1 className="landing-title">Command an AI dev team from one prompt.</h1>
          <p className="landing-desc">
            A graph-driven build console where agents clarify, architect, plan,
            code, review, execute, debug, and verify a full-stack application.
          </p>

          <div className="landing-actions">
            <button className="btn btn-accent" onClick={() => setActivePage("agents")}>
              VIEW AGENTS
            </button>
            <button className="btn" onClick={() => setActivePage("sandbox")}>
              SANDBOX FLOW
            </button>
          </div>

          <div className="landing-metrics" aria-label="Platform capabilities">
            <div className="metric">
              <span className="metric-value">27</span>
              <span className="metric-label">graph nodes</span>
            </div>
            <div className="metric">
              <span className="metric-value">5</span>
              <span className="metric-label">agent phases</span>
            </div>
            <div className="metric">
              <span className="metric-value">live</span>
              <span className="metric-label">ws telemetry</span>
            </div>
          </div>
        </div>

        <LaunchComposer
          requirementInput={requirementInput}
          setRequirementInput={setRequirementInput}
          isStarting={isStarting}
          handleStart={handleStart}
        />
      </div>
    </section>
  );
}

function LaunchComposer({ requirementInput, setRequirementInput, isStarting, handleStart }) {
  return (
    <div className="landing-right">
      <div className="input-block input-block--hero">
        <div className="input-head">
          <label className="input-label">PROJECT REQUIREMENT</label>
          <span className="input-status">POST /API/PROJECTS</span>
        </div>
        <textarea
          value={requirementInput}
          onChange={(e) => setRequirementInput(e.target.value)}
          placeholder="Build a SaaS expense tracker with teams, approvals, analytics, and admin roles..."
          rows={5}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleStart();
          }}
        />
        <div className="input-actions">
          <button
            className="btn btn-accent"
            onClick={handleStart}
            disabled={!requirementInput.trim() || isStarting}
          >
            {isStarting ? "INITIALIZING..." : "START BUILD"}
          </button>
          <span className="input-shortcut">Ctrl+Enter</span>
        </div>
      </div>

      <div className="templates">
        <span className="templates-label">STARTER BLUEPRINTS</span>
        {[
          "Blog platform with comments, tags, and editor roles",
          "E-commerce store with admin panel and order analytics",
          "Real-time chat app with rooms and moderation tools",
        ].map((ex) => (
          <button key={ex} className="template-btn" onClick={() => setRequirementInput(ex)}>
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}

function AgentsPage({ setActivePage }) {
  return (
    <section className="info-page">
      <div className="info-hero">
        <p className="landing-pre">AGENT NETWORK</p>
        <h2 className="page-title">Specialized agents, one coordinated build graph.</h2>
        <p className="page-desc">
          Vireon keeps each responsibility separate: product thinking, architecture,
          planning, coding, review, execution, and recovery all move through explicit
          graph nodes.
        </p>
      </div>
      <div className="agent-grid">
        {AGENTS.map(([num, name, desc]) => (
          <article className="agent-card" key={name}>
            <span className="agent-num">{num}</span>
            <h3>{name}</h3>
            <p>{desc}</p>
          </article>
        ))}
      </div>
      <button className="btn btn-accent page-cta" onClick={() => setActivePage("launch")}>
        START A BUILD
      </button>
    </section>
  );
}

function SandboxPage({ setActivePage }) {
  const rows = [
    ["Scaffold", "Creates backend, frontend, config, env files, and project folders."],
    ["Database", "Selects PostgreSQL or MongoDB and prepares connection settings."],
    ["Containers", "Runs services inside Docker when Docker is available."],
    ["Snapshots", "Commits successful milestones so builds can recover safely."],
  ];

  return (
    <section className="info-page split-page">
      <div className="info-hero">
        <p className="landing-pre">SANDBOX RUNTIME</p>
        <h2 className="page-title">Generated code runs inside an isolated workspace.</h2>
        <p className="page-desc">
          The backend API calls do not change here. The dashboard still starts builds
          through `/api/projects`, while the graph prepares a sandboxed project behind it.
        </p>
        <button className="btn btn-accent page-cta" onClick={() => setActivePage("launch")}>
          OPEN LAUNCHER
        </button>
      </div>
      <div className="runtime-panel">
        {rows.map(([title, desc], index) => (
          <div className="runtime-row" key={title}>
            <span className="runtime-step">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ConsolePage({ setActivePage }) {
  return (
    <section className="info-page console-preview-page">
      <div className="info-hero">
        <p className="landing-pre">MISSION CONSOLE</p>
        <h2 className="page-title">Live visibility after the build starts.</h2>
        <p className="page-desc">
          The active project screen keeps pipeline state, event logs, generated outputs,
          human input prompts, and token budget in one operational workspace.
        </p>
      </div>
      <div className="console-preview">
        <div className="preview-top">
          <span>RUNNING</span>
          <span>project-queued</span>
        </div>
        <div className="preview-track">
          {["PM", "ARCH", "PLAN", "CODE", "VERIFY"].map((label, i) => (
            <div className={`preview-node ${i < 2 ? "preview-node--done" : i === 2 ? "preview-node--active" : ""}`} key={label}>
              {label}
            </div>
          ))}
        </div>
        <div className="preview-log">
          <span>20:41:03 NODE PM Agent</span>
          <span>20:41:07 ARCH Entities and schema ready</span>
          <span>20:41:10 PLAN Task queue generated</span>
        </div>
      </div>
      <button className="btn btn-accent page-cta" onClick={() => setActivePage("launch")}>
        LAUNCH PROJECT
      </button>
    </section>
  );
}
