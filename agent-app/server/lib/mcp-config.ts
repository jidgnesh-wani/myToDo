/**
 * Phase 7 — External-agent (MCP/A2A) exposure policy for the todo app.
 *
 * The framework auto-mounts `/mcp` on every agent-native app. This module is
 * the single source of truth for what external callers may see and call:
 *
 * - Only read-only actions are directly callable (`connectorCatalog` plus the
 *   GET + readOnly + publicAgent.requiresAuth annotations on the actions).
 * - Mutations are not advertised; `writes: "ask_app_only"` routes any write
 *   through the agent loop (`ask_app` / `ask-agent`) so approval gating still
 *   applies.
 * - `denyActions` is defense-in-depth against destructive tools ever landing
 *   on the external surface through a future allow-list entry.
 */

/** Read-only actions safe for direct invocation by authenticated callers. */
export const MCP_CONNECTOR_CATALOG = ["listTasks", "getScratchpad"] as const;

/** Mutating actions that must never be directly exposed to external callers. */
export const MUTATING_ACTION_NAMES = [
  "createTask",
  "updateTask",
  "deleteTask",
  "saveScratchpad",
] as const;

/**
 * Mutating actions gated by human approval in the chat UI, per the
 * confirmation rules in `plan/agent-workflows.md` (`createTask` is
 * intentionally ungated).
 */
export const APPROVAL_GATED_ACTION_NAMES = [
  "updateTask",
  "deleteTask",
  "saveScratchpad",
] as const;

export const mcpOptions = {
  title: "Todo",
  description:
    "Read access to your tasks and scratchpad. Mutations run through the todo agent's approval flow.",
  connectorCatalog: [...MCP_CONNECTOR_CATALOG],
  externalAgents: {
    authenticatedReads: "auto" as const,
    writes: "ask_app_only" as const,
    denyActions: [...MUTATING_ACTION_NAMES],
  },
};
