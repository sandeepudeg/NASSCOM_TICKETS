# 🌐 Traefik Gateway: The Infrastructure "Air Traffic Controller"

This document provides a non-technical and technical overview of Traefik in the TicketIQ infrastructure.

---

## 1. Traefik for Laymen: The "Concierge" Analogy
Imagine you are visiting a massive hotel (our application) with many different rooms: a restaurant (API), a front desk (Frontend), and a security office (Admin).

Without a concierge (Traefik), guests wouldn't know which door leads where. They might try to enter the kitchen to check in, or wander into the security office looking for food.

**Traefik is the Concierge standing at the front door:**
- **It greets everyone**: It listens on standard ports (80/443).
- **It checks your "intent"**: If you ask for `/api`, it walks you to the API room. If you ask for `/admin`, it takes you to the Admin room.
- **It keeps things safe**: It can handle locks (SSL/TLS) and ensure rooms aren't overcrowded (Load Balancing).
- **It's smart**: If a room is closed for maintenance (service down), it tells guests to wait or redirects them, rather than letting them walk into a dark room.

---

## 2. How it is used in TicketIQ
In our stack, Traefik is the **only service exposed to the outside world**. Everything else stays hidden in a private Docker network.

### Routing Logic
We use **Path-Based Routing**. Traefik reads the URL path and maps it to a container:
- **`yourdomain.com/`** → Routes to `frontend` (React UI)
- **`yourdomain.com/api`** → Routes to `api` (FastAPI Backend)
- **`yourdomain.com/admin`** → Routes to `flask-admin` (Management UI)

### Automated Discovery
We don't manually tell Traefik where the services are. Instead, Traefik watches the "Docker Socket." When we start a container with labels like `traefik.enable=true`, Traefik automatically adds it to its map.

---

## 3. Key Highlights & Features
- **Dynamic Configuration**: No need to restart the gateway when adding new features.
- **Multi-Protocol Support**: Handles HTTP, HTTPS, and even raw TCP/UDP if needed.
- **Middleware**: It can modify requests on the fly (e.g., adding security headers, stripping prefixes, or rate-limiting).
- **Native Observability**: It integrates directly with Prometheus (Metrics) and Jaeger (Tracing), which we just activated.

---

## 4. Metrics to Watch (The "Pulse" of the App)
If you are looking at the Grafana dashboard or Master Control, watch these:

| Metric | Why it matters | Ideal Value |
| :--- | :--- | :--- |
| **Request Latency** | How fast Traefik is passing requests. | < 200ms |
| **HTTP 5xx Errors** | Means a backend service is crashing or down. | 0% |
| **HTTP 4xx Errors** | Usually means users are hitting wrong URLs or Auth issues. | < 5% |
| **Request Volume** | Total traffic. Helps detect DDoS attacks or peak usage. | Steady |
| **Healthy Backend Count** | Shows if Traefik sees all your 15+ services. | 15/15 |

---

## 5. Potential Issues & Risks
Even a great concierge can face problems:

### ⚠️ The "Single Point of Failure" Risk
Because *all* traffic goes through Traefik, if it crashes, the entire application goes offline, even if the backend is perfectly fine.
- **Mitigation**: We use `restart: unless-stopped` in Docker to ensure it reboots immediately if it fails.

### ⚠️ Misconfiguration (The "Wrong Door" Risk)
If two services claim the same path (e.g., both want `/api`), Traefik might get confused and send traffic to the wrong one.
- **Symptom**: You see random "404 Not Found" or "502 Bad Gateway" errors.

### ⚠️ Resource Exhaustion
Traefik uses memory and CPU to manage thousands of concurrent connections.
- **Observation**: Look for high CPU usage on the `tickets_traefik` container in Docker.

---

## 6. Accessing the Gateway Internals
You can see Traefik's own "brain" by visiting:
- **Dashboard**: `http://localhost:8081` (Internal status and routing map)
- **Health Check**: `http://localhost:8081/ping` (Returns `OK` if Traefik is alive)
- **Metrics**: `http://localhost:8081/metrics` (The raw data Prometheus reads)
