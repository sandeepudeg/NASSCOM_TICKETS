# 📈 Prometheus Metrics: The Infrastructure "Pulse Sensors"

This document provides a non-technical and technical overview of how Prometheus metrics work in the TicketIQ infrastructure.

---

## 1. Prometheus for Laymen: The "Smart Hospital Sensors" Analogy
Imagine you are managing a massive, automated hospital. To keep it running, you've installed thousands of tiny sensors everywhere:

- **The Turnstiles (Counters)**: These sensors only ever count *up*. They count how many patients walked in, how many pills were dispensed, and how many times the elevator was used.
- **The Thermometers (Gauges)**: These sensors go *up and down*. They tell you the current temperature of the operating room, how much oxygen is left in a tank, or how many doctors are currently on duty.
- **The Wait-Time Buckets (Histograms)**: These are special sensors that sort events by speed. They don't just say "patients waited 10 minutes"; they say "50 patients waited less than 1 minute, and 2 patients waited more than an hour."

**Prometheus is the "Pulse Taker" that walks around every 15 seconds, reads every single one of these sensors, and writes the numbers down in a massive logbook.**

---

## 2. How it is used in TicketIQ
In our system, Prometheus "scrapes" (gathers) data from our services (API, Traefik, etc.) to give us a real-time view of the system's health.

### The Three Main Types of Data:
1.  **Counters**: used for counting events (e.g., "How many tickets were submitted today?").
2.  **Gauges**: used for current values (e.g., "How many AI models are currently running?").
3.  **Histograms**: used for timing (e.g., "How long does it take for the AI to classify a ticket?").

---

## 3. Key Metrics to Watch (The "Vitals")

If you are looking at the Prometheus Explorer or a Grafana panel, these are the most important numbers:

| Metric Name | What it tells you | Ideal Trend |
| :--- | :--- | :--- |
| `http_requests_total` | Total number of clicks and actions. | Steady (Matches business hours) |
| `up` | Is the service alive? (1 = Yes, 0 = No) | Should always be 1 |
| `ticket_classification_duration` | How fast the AI is working. | < 2 seconds |
| `rag_retrieval_duration` | How fast we are finding similar tickets. | < 0.5 seconds |
| `process_resident_memory_bytes`| How much RAM the server is using. | Steady (No "Memory Leaks") |

---

## 4. How to Use the "Stethoscope" (Prometheus UI)
While you will usually use Grafana to see pretty charts, sometimes you need to look at the raw data in the Prometheus UI.

1.  **Access the UI**: Visit `http://localhost:9090`.
2.  **The Expression Bar**: This is where you type the name of the sensor you want to read.
    - *Example*: Type `up` and click "Execute" to see which services are alive.
3.  **The Graph Tab**: Click the "Graph" tab to see how that number has changed over the last hour.

### 💡 Example Queries for Laymen:
*   **"How many tickets have been classified so far?"**
    - Query: `sum(http_requests_total{path="/api/v1/tickets"})`
*   **"Is the AI getting slower over time?"**
    - Query: `histogram_quantile(0.95, sum by (le) (rate(ticket_classification_duration_seconds_bucket[5m])))`
    - *(This shows the speed of the slowest 5% of classifications over the last 5 minutes)*.

---

## 5. Potential Issues & Risks
Even the best sensors can be misleading:

### ⚠️ The "Reset" Trap
When a server restarts, its **Counters** (like `http_requests_total`) will reset to zero.
- **Don't panic**: Prometheus is smart enough to handle this "counter reset" when calculating rates, but the raw number might look small suddenly.

### ⚠️ High Cardinality (The "Too Much Data" Risk)
If we try to track every single user's ID as a separate sensor, Prometheus will run out of memory.
- **Mitigation**: We only track broad categories (like `category="infrastructure"`) rather than individual user names.

---

## 6. Accessing the Pulse Logbook
- **Internal URL**: `http://localhost:9090`
- **Metrics Endpoint**: `http://localhost:8005/metrics` (This is the raw text that Prometheus reads from our API).

> [!TIP]
> If you want to see these numbers turned into beautiful graphs, head over to the [**Master Control Dashboard**](file:///d:/Learning/Self_learning/Nasscom/Tickets/docs/GRAFANA_VIZ_GUIDE.md).
