# Open Items

Remaining work after the Agent-Native conversion (post Phase 8 closeout, 2026-08-26).

## Manual verification (from Phase 8 step 2)

- Use the app end-to-end as before: task CRUD in `frontend-next` (port 3001) against Spring Boot dev (port 8000).
- Open the agent panel in `agent-app` (port 8080) and ask it to list or summarize tasks.
- Approve an agent proposal that creates or updates tasks; confirm success/error rows land in the `action_audit_log` table of `agent-app/data/app.db`.

## Frontend

- Fix the pre-existing `__tests__/TaskContext.test.js` failure ("should persist inProgress, timeTaken, and longTerm when updating a task"): the mocked `onPopupClose` path calls `taskManagement.fetchTasks()`, which the test's mock does not provide. Unrelated to the conversion.
- Clean up 4 pre-existing eslint `no-unused-vars` warnings (`components/DateComponent.js`, `components/Scratchpad/hooks/useScratchpadSlashMenu.js`, `contexts/TaskContext.js`, `lib/dragUtils.js`).

## Actions / MCP surface

- Re-check `plan/actions-candidates.md` for candidate operations not yet exposed as actions; any new action must be classified in `agent-app/server/lib/mcp-config.ts` and pinned by `agent-app/actions/mcp-exposure.spec.ts`.
