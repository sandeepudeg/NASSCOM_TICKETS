# 🛡️ TicketIQ Observability: The "Smart Hospital" Manual

This manual provides a detailed, layman-friendly guide to every dashboard and monitoring tool available in the TicketIQ infrastructure. For a granular, item-by-item reference of every specific widget and graph, see the [**Dashboard Item Catalog**](file:///d:/Learning/Self_learning/Nasscom/Tickets/docs/DASHBOARD_ITEM_CATALOG.md).

---

## 🏥 The Analogy: Monitoring a "Smart Hospital"
To understand our monitoring stack, imagine TicketIQ is a massive, fully automated hospital.

1.  **The Nurse's Station (Master Control)**: A big screen showing the vital signs (Heart rate, Blood Pressure) of every department. You look here to see if anything is "crashing" right now.
2.  **The Lab Reports (Loki Logs)**: The detailed notes written by doctors and machines for every single interaction. You look here to find the "Hidden Clues" when something feels wrong.
3.  **The X-Ray Machine (Jaeger Traces)**: A way to follow a single patient (a Ticket) through every room and department to see exactly where they got stuck.

---

## 📺 Dashboard 1: The Master Control (Nurse's Station)
**Purpose**: This is your daily "Health Check." It tells you at a glance if the system is alive or dying.

### Key Panels & How to Read Them:
*   **🟢 API Status**:
    *   **What it is**: A green/red light for the "Brain" of our app.
    *   **Good**: Large "1" in green. Everything is fine.
    *   **Bad**: "0" in red. The backend has crashed! No tickets can be submitted.
*   **📈 Traffic Volume (Requests/sec)**:
    *   **What it is**: A speedometer showing how many people are using the app.
    *   **Normal**: Steady lines.
    *   **Warning**: A massive spike might mean a "DDoS Attack" or a viral influx of tickets.
    *   **Critical**: A sudden drop to zero (flatline) means the front door is locked.
*   **📜 Live System Logs**:
    *   **What it is**: A scrolling ticker of the system's latest thoughts.
    *   **How to use**: Look for colors! White is normal chatter; Yellow is a warning; Red is an emergency.

---

## 🔍 Dashboard 2: The Log Explorer (The Lab Report)
**Purpose**: Deep investigation. This is where you go when you know *something* is wrong, but you don't know *what*.

### How to use it:
1.  Click the **"Explore"** icon (🧭) on the left sidebar.
2.  Select **"Loki"** from the dropdown at the top.
3.  In the search bar, type your query.

### Real-World Examples:
*   **Example 1: Finding an Error**
    *   **Search**: `{job="promtail"} |= "error"`
    *   **What it does**: Shows every single error message across the entire hospital.
*   **Example 2: Tracking a Specific Ticket**
    *   **Search**: `{job="promtail"} |= "ticket_550e8400"`
    *   **What it does**: Shows the entire history of Ticket #550e8400. You'll see it arrive, get classified, and get saved.

---

## 🧬 Dashboard 3: The Trace Analyzer (The X-Ray)
**Purpose**: Performance tuning. This is used when a ticket is "slow" rather than "broken."

### The "Trace Link" Magic (Cross-Referencing):
In the **Log Explorer**, you will often see a blue button or link next to an error that says **"Jaeger"**.
*   **Clicking this** takes you from the "Lab Report" (Log) directly into the "X-Ray" (Trace).

### How to read an X-Ray:
*   **The Timeline**: You see a long bar showing the total time (e.g., 5 seconds).
*   **The Breakdown**: Beneath it, you see smaller bars for each "step."
    *   If `ticket.classify` is a tiny bar, but `rag.retrieve` is a massive long bar, you've found the bottleneck: the database is slow!

---

## 🚨 Dashboard 4: The Alert Manager (The Alarm System)
**Purpose**: To see why the red lights are flashing.

### How to use it:
1.  Click the **"Alerting"** icon (🔔) on the left sidebar.
2.  Select **"Alert rules"**.

### What to look for:
*   **Firing**: The alarm is screaming. Someone needs to fix this *now*.
*   **Pending**: The system is worried. If the problem persists for 5 more minutes, the alarm will scream.
*   **Normal**: Total silence. All is well.

---

## 🛠️ Accessing the Manual (Admin Details)
*   **URL**: `http://localhost:3002`
*   **Username/Password**: `admin` / `admin`
*   **Pro Tip**: If a dashboard looks empty, check the **Time Picker** in the top right. Change it from "Last 5 minutes" to "Last 3 hours."

> [!IMPORTANT]
> **Data Persistence**: All these dashboards are saved in a "Volume." Even if you restart your computer, your monitoring history stays safe.
