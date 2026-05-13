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

export default function App() {
  const [requirementInput, setRequirementInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);

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
          <div className="landing">
            <div className="landing-inner">
              <div className="landing-left">
                <p className="landing-pre">VIREON AI</p>
                <h1 className="landing-title">
                  Ship software from a single requirement.
                </h1>
                <p className="landing-desc">
                  An autonomous multi-agent development platform where PM, Architect,
                  Planner, Coder, Reviewer, Executor, and Debugger agents move an idea
                  from product brief to sandboxed application.
                </p>
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
              <div className="landing-right">
                <div className="input-block">
                  <label className="input-label">PROJECT REQUIREMENT</label>
                  <textarea
                    value={requirementInput}
                    onChange={(e) => setRequirementInput(e.target.value)}
                    placeholder="Build a todo app with categories, due dates, and user authentication..."
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
                  <span className="templates-label">TEMPLATES</span>
                  {[
                    "Blog platform with comments and tags",
                    "E-commerce store with admin panel",
                    "Real-time chat app with rooms",
                  ].map((ex) => (
                    <button
                      key={ex}
                      className="template-btn"
                      onClick={() => setRequirementInput(ex)}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
