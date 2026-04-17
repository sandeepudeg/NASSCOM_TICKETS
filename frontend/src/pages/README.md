# Frontend Pages

This directory contains all the main page components for the Tickets Folder feature.

## Pages Implemented

### 1. TicketSubmissionForm (`/tickets/new`)
- Form for submitting new tickets
- Fields: title, description, priority, structured payload (JSON)
- Format selector: text, json_log, otlp_trace, prometheus_alert
- JSON validation for structured payloads
- Navigates to ClassificationResultPanel on success

### 2. ClassificationResultPanel (`/tickets/{id}`)
- Displays ticket classification results
- Shows: category, confidence score, routing status, causal signal
- Lists similar tickets with similarity scores
- Displays resolution suggestions with source ticket links
- Warning banner for low retrieval confidence

### 3. TicketListPage (`/tickets`)
- Paginated table of all tickets
- Filters: status, category, routing_status
- Cursor-based pagination with "Load More" button
- Links to individual ticket details

### 4. EscalationQueuePage (`/escalations`)
- Lists escalated tickets sorted oldest-first
- Shows classifier suggestions and similar tickets
- Override form with 7 category options
- Submits to `POST /api/v1/escalations/{id}/override`

### 5. PatternAlertsPage (`/pattern-alerts`)
- Lists active and historical pattern alerts
- Shows cluster size, representative title, ticket links
- Actions: acknowledge, snooze (with duration picker), dismiss
- Badge indicators for active alerts

### 6. DashboardPage (`/dashboard`)
- Summary cards: open tickets, escalation queue depth, active pattern alerts, classifier accuracy
- Recent activity feed
- System status metrics
- Auto-refreshes every 30 seconds via TanStack Query

### 7. ModelPerformancePage (`/model/metrics`)
- Displays macro F1 score
- Per-category F1 scores in sortable table
- Semantic similarity score
- LLM-as-judge metrics: routing correctness, resolution relevance
- Performance interpretation guide

## Dependencies

- React 18
- TypeScript
- Ant Design (UI components)
- TanStack Query (data fetching)
- React Router v6 (routing)
- dayjs (date handling)

## Usage

All pages are automatically imported in `App.tsx` and configured with their respective routes.

To add a new page:
1. Create the component in this directory
2. Export it from `index.ts`
3. Import and add route in `App.tsx`
