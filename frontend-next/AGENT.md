# Frontend (Next.js)

## Purpose

Own all Next.js frontend code: components, contexts, hooks, utilities, app router pages, and styling.

## Ownership

All files under `frontend-next/`.

## Local Contracts

- Next.js App Router (`app/` directory)
- TypeScript for new files; JavaScript for existing
- Context-based state management (`TaskContext`, `UIContext`, `StopwatchContext`)
- Data access through `lib/agentClient.ts`: tries the agent-app actions first (`NEXT_PUBLIC_AGENT_URL`, e.g. `http://localhost:8080`), then falls back to direct REST with the Spring Boot backend (`service.js` + `lib/constants.js`)
- Tests in `__tests__/` using Jest

## Work Guidance

- New components: place in `components/`, add to the closest parent that renders them
- New contexts: add to `contexts/`, document in `lib/registry.tsx` if global provider
- New hooks: add to `hooks/`
- New utilities: add to `lib/`
- Styling: prefer CSS modules (`.module.css`) or existing CSS/SCSS files
- Cross-day drag-and-drop and same-day reorder logic live in component + `lib/dateHelpers.js`
- Agent chat panel: `MainView.js` renders an iframe (`src` = `NEXT_PUBLIC_AGENT_URL`) in an `agent-sidebar` aside, toggled by the floating "Ask AI" FAB (`#agent-fab`); both are only rendered when `NEXT_PUBLIC_AGENT_URL` is set
- Page context contract: `MainView.js` sends `{ view, selectedTaskId, selectedDate, filters }` whenever route/popup changes — via `setPageContext()` in `lib/agentClient.ts` (PUT to agent-app `/_agent-native/application-state/page-context`) and a `agentNative.setChatContext` postMessage that pre-fills the iframe composer; the agent reads it back with the `view-screen` action in `agent-app/`

## Ports

- Dev & Prod: **3001** (`-p 3001` in `package.json`)

## Commands

- **Dev (watch):** `cd frontend-next && npm run dev`        (port 3001)
- **Dev (default port):** `cd frontend-next && npx next dev`
- **Build (static export):** `cd frontend-next && npm run build`
- **Prod run (standalone):** `cd frontend-next && npm start`

## Verification

- `cd frontend-next && npm run lint`
- `cd frontend-next && npm run test`

## Child DOX Index

None
