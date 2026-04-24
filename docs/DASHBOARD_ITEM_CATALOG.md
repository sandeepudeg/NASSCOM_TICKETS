# 🔍 Granular Catalog: Dashboard Item-by-Item Reference

This document provides a line-by-line, item-by-item reference for every visualization in the TicketIQ Monitoring Hub. Use this for precise troubleshooting and to understand exactly what each widget is telling you.

---

## 🏗️ Dashboard: Master Control V2

### 1. API Status (The "Brain" Pulse)
- **Type**: Single Stat Indicator
- **Layman's View**: The power light for the core application.
- **How to Use**:
    - **Green (1)**: The FastAPI backend is responding to heartbeats.
    - **Red (0)**: The backend is down. Tickets will NOT be processed.
- **Example**: If this is Red, the first thing to check is the `tickets_api` container logs.

### 2. Gateway Status (The "Front Door")
- **Type**: Single Stat Indicator
- **Layman's View**: Is the entrance to the building open?
- **How to Use**:
    - **Green (1)**: Traefik (our gateway) is successfully routing traffic.
    - **Red (0)**: The gateway is broken. Users cannot even reach the login page.
- **Example**: If Gateway is Green but API is Red, users can see the website, but nothing works when they click "Submit."

### 3. Error Rate (5xx) (The "Critical Failure" Meter)
- **Type**: Percentage Gauge
- **Layman's View**: What percentage of users are seeing "Internal Server Error" right now?
- **How to Use**:
    - **0.0 - 0.01**: Normal (minor noise).
    - **> 0.1**: **EMERGENCY**. 10% of users are seeing crashes.
- **Example**: A sudden jump here usually means a database table is locked or the AI model has run out of memory.

### 4. Traffic Volume (The "Crowd" Monitor)
- **Type**: Timeline Graph (Requests per minute)
- **Layman's View**: How busy is the hospital?
- **How to Use**:
    - **Steady Slope**: Healthy usage.
    - **Jagged Spikes**: High-burst activity (e.g., a marketing campaign or an incident).
    - **Flatline**: No one is using the app.
- **Interactive feature**: Drag your mouse over a specific spike to "Zoom In" and see the exact second the traffic increased.

### 5. P95 Latency (The "Waiting Room" Timer)
- **Type**: Timeline Graph (Milliseconds)
- **Layman's View**: How long is the *slowest* 5% of users waiting for a response?
- **How to Use**:
    - **< 500ms**: Lightning fast.
    - **> 2000ms (2s)**: Slow. Users will start to feel frustrated.
    - **> 5000ms (5s)**: Critical. The AI model is likely struggling to keep up.
- **Example**: If latency spikes but traffic is low, it means a specific feature (like AI Classification) is hanging.

### 6. Live Intelligence Feed (The "Doctor's Notes")
- **Type**: Log Stream with Correlation
- **Layman's View**: A live, scrolling transcript of everything the servers are thinking.
- **How to Use**:
    - **Filtering**: Type a word like "ticket" or "error" in the local filter box to find specific events.
    - **The Magic Link**: Click on any log line that has a `trace_id`. A blue "Jaeger" button will appear. Click it to see the "X-Ray" of that specific event.

---

## 🧭 The Explorer Items (Ad-hoc Analysis)

When you leave the dashboards and go to the **"Explore"** tab, you have access to raw items:

| Item | What it is | How to use it |
| :--- | :--- | :--- |
| **Log Labels** | Metadata like `{service="api"}` | Click them to instantly filter your entire view to just one part of the system. |
| **Trace Spans** | Horizontal bars in Jaeger | Hover over them to see exactly how many milliseconds were spent on "Database Query" vs "AI Inference." |
| **Derived Fields** | Automatic links in logs | These turn a boring ID (like `trace_id=xyz`) into a clickable button that solves the mystery. |

---

## 🎓 Summary Table for Reference

| Item Name | Frequency | Alert Threshold | Ideal State |
| :--- | :--- | :--- | :--- |
| **API Status** | 15s | 0 | 1 |
| **Error Rate** | 1m | > 5% | 0% |
| **P95 Latency**| 5m | > 3s | < 200ms |
| **Gateway** | 15s | 0 | 1 |

> [!TIP]
> To see a detailed guide on the overall monitoring strategy, refer back to the [**Dashboard User Manual**](file:///d:/Learning/Self_learning/Nasscom/Tickets/docs/DASHBOARD_USER_MANUAL.md).
