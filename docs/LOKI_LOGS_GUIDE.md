# 📜 Loki Logs: The Infrastructure "Black Box Recorder"

This document provides a non-technical and technical overview of our log management system, Grafana Loki.

---

## 1. Loki for Laymen: The "Black Box Recorder" Analogy
Imagine every single action in your office is written down in a massive, infinite diary.

- **The Diary (Loki)**: This is where we store every "Log Line" (diary entry) from every service in our infrastructure.
- **The Entry (Log Line)**: A single sentence describing what happened at a specific microsecond.
    - *Example*: "12:00:01 - User 'admin' logged into the dashboard."
    - *Example*: "12:00:05 - AI classified Ticket #123 as 'Security'."
- **The Index Tags (Labels)**: Instead of reading the entire diary to find one event, we use "Sticky Notes" on the side of the pages.
    - Tag: `container_name=tickets_api` (Show me only entries from the API).
    - Tag: `level=error` (Show me only entries where something went wrong).

**Loki is our "Time Machine." If something broke 2 hours ago, we go back in the diary to see exactly what the system was "saying" at that exact moment.**

---

## 2. How it is used in TicketIQ
In our application, Loki is the **Ultimate Witness**. When an error occurs, it is the first place we look for evidence.

### The Trace-to-Log Link:
Loki is extra powerful because it works with **Jaeger Tracing**.
1.  You find a "Slow Journey" in Jaeger.
2.  You click a button, and Loki shows you the *exact* diary entries that were written during that specific journey.
3.  This allows you to see the "Story" behind the "X-Ray."

---

## 3. Key Highlights & Features
- **Cost Efficient**: Unlike other logging systems, Loki doesn't try to memorize every single word. It only memorizes the "Tags" (Labels), which makes it 10x cheaper and faster.
- **Grafana Integration**: You can view your logs directly inside the Grafana dashboards, right next to your health charts.
- **Live Tail**: You can watch the "Diary" as it is being written in real-time.

---

## 4. How to Use the "Diary Reader" (Grafana Explore)
You can search through the system's history here:

1.  **Access the Reader**: Visit `http://localhost:3002` (Grafana) and click the **Explore** icon (Compass) in the sidebar.
2.  **Select Datasource**: Pick **Loki** from the dropdown at the top.
3.  **Build a Query**:
    - Click **Label Browser**.
    - Select `container_name`.
    - Select `tickets_api`.
    - Click **Show Logs**.
4.  **Search for Words**: Use the "Line contains" filter to find specific keywords like "Error," "Timeout," or a specific "Ticket ID."

### 💡 Example Task: "Debugging a Failed Login"
1.  Go to **Grafana Explore**.
2.  Set the label to `{container_name="tickets_keycloak"}`.
3.  In the search bar, type `invalid password`.
4.  Loki will show you every time a user tried to log in with the wrong password!

---

## 5. Potential Issues & Risks
Keeping a diary of everything can be messy:

### ⚠️ "Too Much Noise"
If a service is "chatty," it might write 1,000 lines per second. This makes it hard to find the one line that actually matters.
- **Solution**: Use the `level=error` or `level=warn` filters to hide the "normal" chatter.

### ⚠️ "Log Gaps"
If the "Scribe" (Promtail) crashes, the diary will have blank pages.
- **Observation**: If you see "No data" for a specific time period, check if the `tickets_promtail` container is running.

---

## 6. Accessing the Diary
- **API Endpoint**: `http://localhost:3100`
- **Main Viewer**: Via Grafana Explore (`http://localhost:3002/explore`)

> [!TIP]
> Use the **"Log Volume"** chart at the top of the Explore page. A sudden "Spike" in the chart usually means the system is panicking and writing lots of error messages!
