# 📊 Grafana Viz: The Infrastructure "Mission Control"

This document provides a non-technical and technical overview of Grafana in the TicketIQ infrastructure. For a step-by-step guide on how to use every specific screen and tool, see the [**Dashboard User Manual**](file:///d:/Learning/Self_learning/Nasscom/Tickets/docs/DASHBOARD_USER_MANUAL.md).

---

## 1. Grafana for Laymen: The "CCTV Hub" Analogy
Imagine you are the manager of a high-tech airport. You have thousands of sensors: cameras in the hallways (Logs), passenger counters at the gates (Metrics), and luggage trackers (Traces).

If you had to look at each sensor's raw data individually, you'd be overwhelmed by millions of lines of text and numbers.

**Grafana is the Wall of Screens in your Mission Control Room:**
- **It brings everything together**: Instead of going to three different offices, you see the cameras, counters, and trackers on one giant dashboard.
- **It translates "nerd-speak" into pictures**: Instead of seeing `HTTP_200 0.45s`, you see a green bar that says "Healthy" or a graph showing "Fast Response."
- **It sounds the alarm**: If a camera goes dark or a gate gets too crowded, a red light flashes on the screen to tell you exactly where to look.
- **It's interactive**: You can click on a "spike" in traffic to see exactly which passenger (or ticket) caused it.

---

## 2. How it is used in TicketIQ
In our stack, Grafana is the **Visual Intelligence Layer**. It doesn't generate data itself; it "reaches out" to our other services to pull information and display it beautifully.

### The "Data Sources" (Grafana's Eyes)
1. **Prometheus**: Provides the "Pulse" (numbers, counts, and speed).
2. **Loki**: Provides the "Eyes" (raw system logs and text).
3. **Jaeger**: Provides the "X-Ray" (detailed path of a single ticket through the system).

### Unified View
We use **Correlations**. When you see a weird error in a log (Loki), Grafana provides a direct link to the specific trace (Jaeger) so you can see exactly why that specific error happened.

---

## 3. Key Highlights & Features
- **Master Control Dashboard**: A single page showing the health of all 15+ services, current traffic, and live logs.
- **Real-time Alerting**: Sends notifications if the system starts slowing down or failing.
- **Time Travel**: You can scroll back to "yesterday at 2 PM" to see exactly what the system was doing during a reported issue.
- **Glassmorphism Design**: Our dashboards use modern, high-contrast themes for maximum readability.

---

## 4. Dashboards to Watch (The "Screens" to Monitor)
If you are logged into Grafana, these are your primary tools:

| Dashboard | What it shows | When to use it |
| :--- | :--- | :--- |
| **Master Control** | Overall system "Vital Signs." | Daily check-ins or during a crisis. |
| **API Performance** | How fast the backend is responding. | If users complain the app is "slow." |
| **Loki Logs** | Live feed of everything the servers are saying. | To find the "Root Cause" of an error. |
| **Ollama Health** | Status of our local AI models. | If "Agentic Simulation" fails to start. |

### 💡 Example Scenarios:
*   **Scenario A: "The App is Slow"**
    1.  Open **Master Control**.
    2.  Check the **"Traffic Volume"** graph. Is there a massive spike?
    3.  Check **"API Status"**. Is it green?
    4.  If it's red, look at the **"Live System Logs"** panel at the bottom to see the error messages.
*   **Scenario B: "I want to see why Ticket #123 failed"**
    1.  Go to the **"Explore"** tab.
    2.  Select **Loki** as the datasource.
    3.  Search for `{job="promtail"} |= "123"` (This looks for logs containing ticket ID 123).
    4.  Click on a log line and select **"Jaeger"** from the correlation link to see the full "Life of the Ticket."

---

## 5. Pro Tips for Power Users
*   **The "K" Shortcut**: Press `k` on your keyboard to bring up a list of all keyboard shortcuts.
*   **Ad-hoc Filters**: You can click on any label in a log line (like `service="api"`) to quickly filter the view to only show that service.
*   **Annotations**: If you see a vertical dotted line on a graph, that's an **Annotation**. It marks an event, like a new deployment or a system restart. Hover over it to see what happened.

---

## 6. Potential Issues & Risks
Even the best control room can have blind spots:

### ⚠️ "Datasource Unreachable"
If Prometheus or Loki crashes, Grafana's screens will go blank or show "Data missing."
- **Solution**: Check the `tickets_prometheus` or `tickets_loki` containers in Docker.

### ⚠️ "Stale Data" (The Frozen Screen)
Sometimes a graph looks flat because the data stopped flowing, not because the system is perfectly stable.
- **Check**: Look at the "Last updated" timestamp in the top right corner of any panel.

### ⚠️ Performance Overhead
Loading very complex dashboards with 30 days of data can slow down your browser.
- **Best Practice**: Keep your view range to "Last 30 minutes" or "Last 3 hours" for daily monitoring.

---

## 7. Accessing the Control Room
You can enter the Mission Control hub here:
- **URL**: `http://localhost:3002` (Mapped from internal port 3000)
- **Default Username**: `admin`
- **Default Password**: `admin` (Set in `docker-compose.yml`)

> [!TIP]
> Use the **"Explore"** tab on the left sidebar if you want to "dig" into the data without using a pre-made dashboard.
