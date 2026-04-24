# 🧬 Jaeger Tracing: The Infrastructure "X-Ray Machine"

This document provides a non-technical and technical overview of Distributed Tracing using Jaeger in the TicketIQ infrastructure.

---

## 1. Jaeger for Laymen: The "GPS Package Tracker" Analogy
Imagine you order a package online. You don't just want to know *if* it arrived; you want to see exactly where it is and how long it spent at every stop.

- **The Trace (The Full Journey)**: This is the entire trip from the moment you click "Order" to the moment the package hits your porch.
- **The Span (The Individual Stops)**: These are the specific steps in the journey.
    - Stop 1: Sorting Facility (10 minutes)
    - Stop 2: Delivery Truck (4 hours)
    - Stop 3: Final Delivery (2 minutes)
- **The Bottleneck (The Delay)**: If the journey took 5 hours, but the "Delivery Truck" stop took 4 hours and 58 minutes, you know exactly who to blame for the delay!

**Jaeger is our "GPS Tracker" for every ticket. It shows us exactly which part of our system is being slow or failing.**

---

## 2. How it is used in TicketIQ
In our application, a single ticket goes through many "rooms" (services). Jaeger records the exact microsecond the ticket enters and leaves each room.

### A Typical Ticket Journey:
1.  **Entry (Traefik)**: The ticket arrives at the front gate.
2.  **Processing (FastAPI)**: The system starts reading the ticket.
3.  **AI Classification (Ollama)**: The AI tries to figure out the category.
4.  **Database Save (PostgreSQL)**: The result is written to the disc.

If a user complains that submitting a ticket is "slow," we use Jaeger to see if the delay was in the AI room, the Database room, or the Network hallway.

---

## 3. Key Highlights & Features
- **Deep Visibility**: You can see "inside" the code to see exactly how long a specific database query took.
- **Error Spotting**: If a journey "crashes," Jaeger marks that specific step in **Red**, showing you exactly where the failure happened.
- **Correlation**: It works with our Logs (Loki). You can find a "Bad Log" and click a button to see the "X-Ray" (Trace) of that exact moment.

---

## 4. How to Use the "X-Ray Viewer" (Jaeger UI)
You can inspect the journeys of your tickets here:

1.  **Access the UI**: Visit `http://localhost:16686`.
2.  **Search for Traces**:
    - Select **Service**: `tickets-api`.
    - Click **Find Traces**.
3.  **Analyze the Results**:
    - You'll see a list of horizontal bars. Each bar is a "Trace."
    - **Long Bars** = Slow Journeys.
    - **Red Bars** = Journeys with Errors.
4.  **Click a Trace**: This opens the detailed "X-Ray" view.

### 💡 Example Scenario: "Why did this ticket take 10 seconds?"
1.  Open the slow trace in **Jaeger**.
2.  Look for the longest "Span" (the longest horizontal bar).
3.  If you see `rag.retrieve` taking 9 seconds, you now know that searching for similar tickets is what caused the delay.

---

## 5. Potential Issues & Risks
Tracing is powerful, but it comes with a cost:

### ⚠️ "Sampling" (The Missing Journeys)
In a massive system, recording *every* single journey can slow things down. Sometimes we only record 1 out of every 10 journeys (this is called "Sampling").
- **Note**: If you can't find a specific ticket ID in Jaeger, it might have been "sampled out."

### ⚠️ Performance Overhead
The "GPS Tracker" itself uses a little bit of battery. If we track too much detail, it can actually make the application slightly slower.

### ⚠️ Network Dependency
If the Jaeger "Collector" is down, our services will try to send their data and fail.
- **Mitigation**: We use "Non-blocking" tracing, so even if Jaeger is down, the application keeps working (it just stops recording the journeys).

---

## 6. Accessing the X-Ray Room
- **Web UI (Human View)**: `http://localhost:16686`
- **Collector (Machine View)**: `http://localhost:4317` (gRPC) or `4318` (HTTP)

> [!TIP]
> Always look at the **"Timeline"** view first. It's the most intuitive way to see where time is being spent across different services.
