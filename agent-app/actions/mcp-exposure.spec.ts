/**
 * Phase 7 — MCP / external-agent exposure contract.
 *
 * The framework auto-mounts the MCP server at `/mcp`; what an external caller
 * sees is derived from action metadata (`http` method, `readOnly`,
 * `publicAgent`) and the plugin's `mcp.connectorCatalog` /
 * `externalAgents` policy. These tests pin the todo app's curated surface:
 * only the two read-only actions are directly callable; every mutation stays
 * behind the agent loop (`ask_app_only`).
 */

import { describe, expect, it } from "vitest";

import {
  APPROVAL_GATED_ACTION_NAMES,
  MCP_CONNECTOR_CATALOG,
  mcpOptions,
  MUTATING_ACTION_NAMES,
} from "../server/lib/mcp-config";
import getScratchpad from "./getScratchpad";
import listTasks from "./listTasks";

/** Mirrors `isAuthenticatedReadAction` in the framework's MCP builder. */
function isAutoAuthenticatedRead(entry: {
  http?: { method?: string } | false;
  readOnly?: boolean;
  publicAgent?: {
    expose?: boolean;
    readOnly?: boolean;
    requiresAuth?: boolean;
  };
}) {
  return (
    entry.http !== false &&
    entry.http?.method === "GET" &&
    entry.readOnly === true &&
    entry.publicAgent?.expose === true &&
    entry.publicAgent.readOnly === true &&
    entry.publicAgent.requiresAuth === true
  );
}

describe("MCP exposure contract", () => {
  it("exposes listTasks as an authenticated read-only ingest action", () => {
    expect(isAutoAuthenticatedRead(listTasks)).toBe(true);
  });

  it("exposes getScratchpad as an authenticated read-only ingest action", () => {
    expect(isAutoAuthenticatedRead(getScratchpad)).toBe(true);
  });

  it("keeps read actions free of approval gates", () => {
    expect(listTasks.needsApproval).toBeUndefined();
    expect(getScratchpad.needsApproval).toBeUndefined();
  });

  it("keeps the documented approval gates on mutating actions", async () => {
    for (const name of APPROVAL_GATED_ACTION_NAMES) {
      // Static imports (not a dynamic template import) so Vite's
      // dynamic-import-vars plugin doesn't warn about `./${name}.ts`.
      const mod = await import(
        name === "updateTask"
          ? "./updateTask"
          : name === "deleteTask"
            ? "./deleteTask"
            : name === "saveScratchpad"
              ? "./saveScratchpad"
              : "./createTask"
      );
      const entry = mod.default as { needsApproval?: unknown };
      expect(
        entry.needsApproval,
        `${name} must keep needsApproval so agent-driven writes stay gated`,
      ).toBeTruthy();
    }
  });
});

describe("plugin MCP policy", () => {
  it("curates a connector catalog of exactly the read-only actions", () => {
    expect(mcpOptions.connectorCatalog).toEqual([...MCP_CONNECTOR_CATALOG]);
    expect(MCP_CONNECTOR_CATALOG).toEqual(["listTasks", "getScratchpad"]);
  });

  it("keeps writes behind the ask-app-only gate and denies mutations", () => {
    expect(mcpOptions.externalAgents.writes).toBe("ask_app_only");
    expect(mcpOptions.externalAgents.authenticatedReads).toBe("auto");
    for (const name of MUTATING_ACTION_NAMES) {
      expect(mcpOptions.externalAgents.denyActions).toContain(name);
    }
  });
});
