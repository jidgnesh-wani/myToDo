# Agent Workflows

## Purpose
Document high-level agent workflows for the todo application to guide agent-native skill implementation and interaction design.

## Workflows

### 1. Organize my tasks for today
- **Trigger phrase**: "Organize my tasks for today"
- **Actions called**: 
  - `listTasks` (filtered for incomplete)
  - `updateTask` (for each task to set `dayOrder` or `assignedTime` based on prioritization)
- **Expected side effects**: Tasks are reordered/scheduled for today.

### 2. Summarize overdue tasks
- **Trigger phrase**: "Summarize overdue tasks"
- **Actions called**:
  - `listTasks` (filter by date < today and complete=false)
- **Expected side effects**: Agent provides a summary in chat.

### 3. Create a plan to complete all tasks this week
- **Trigger phrase**: "Create a plan to complete all tasks this week"
- **Actions called**:
  - `listTasks` (fetch all)
- **Expected side effects**: Agent proposes a schedule or grouping of tasks for the rest of the week in chat. Requires user approval to apply updates if it proposes changing task dates.

---

## Confirmation Rules

- **Read-only**: No confirmation required (`listTasks`, `getScratchpad`).
- **Mutating**:
  - `deleteTask`: Always requires confirmation (`needsApproval: true`).
  - `updateTask` (bulk): Requires confirmation (`needsApproval: true`).
  - `saveScratchpad`: Requires confirmation (`needsApproval: true`).
  - `createTask`: No confirmation required.

## External-Agent (MCP) Surface

External agents reach the app through the MCP server at `/mcp`. The curated
surface is read-only — `listTasks` and `getScratchpad` only, authenticated;
mutations are never advertised as direct tools. Writes requested by an external
agent go through `ask_app`, which runs this app's agent loop and therefore
applies the confirmation rules above (see root `AGENT.md` → External-Agent
(MCP) Surface).
