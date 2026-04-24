# 🔐 Keycloak IAM: The Infrastructure "Passport Office"

This document provides a non-technical and technical overview of Identity and Access Management (IAM) using Keycloak in the TicketIQ infrastructure.

---

## 1. Keycloak for Laymen: The "Passport Office" Analogy
Imagine our application is a high-security office building. You can't just walk in; you need a valid ID card that proves who you are and what rooms you are allowed to enter.

- **The Passport Office (Keycloak)**: This is the central office that issues ID cards. Every other department (API, Frontend, Admin) trusts this office implicitly.
- **The ID Card (Token)**: When you log in, Keycloak gives you a digital "ID Card." You show this card every time you try to open a door (request data).
- **Citizens (Users)**: These are the individual people who have accounts in our system.
- **Access Levels (Roles)**: Your ID card doesn't just have your name; it has your "Clearance Level."
    - A **"Viewer"** ID can only enter the observation deck.
    - An **"Agent"** ID can enter the ticket processing rooms.
    - An **"Admin"** ID can enter the server room and change the locks.

**Keycloak ensures that only the right people get the right ID cards, and that nobody can "forge" an identity.**

---

## 2. How it is used in TicketIQ
In our stack, Keycloak is the **Central Authority for Truth**. No service in our application stores passwords; they all ask Keycloak to verify them.

### The Authentication Flow:
1.  **Login**: You go to the login page.
2.  **Verification**: Keycloak checks your password.
3.  **The Token**: Keycloak hands you a "JWT Token" (your digital ID card).
4.  **Action**: You send that token to our API. The API checks if the token is signed by Keycloak, and if so, it lets you in.

---

## 3. Key Highlights & Features
- **Single Sign-On (SSO)**: Log in once, and you are automatically logged into the API, the Frontend, and the Admin panel.
- **Social Login**: Keycloak can be configured to let users log in with Google, GitHub, or Microsoft if we choose.
- **Security Hardening**: It handles complex security stuff like "Brute Force Protection" (locking accounts after too many failed tries) and "Password Policies" (requiring numbers and symbols).
- **Realms**: We can have a "Production" realm for real users and a "Test" realm for developers, keeping them completely separate.

---

## 4. How to Use the "Passport Console" (Keycloak UI)
As an administrator, you can manage the "Citizens" of TicketIQ here:

1.  **Access the Console**: Visit `http://localhost:8080`.
2.  **Login**: Use `admin` / `admin`.
3.  **Select Realm**: Ensure you are in the **"tickets"** realm (top left dropdown).
4.  **Manage Users**: Click on "Users" in the left menu.

### 💡 Example Task: "Creating a new Agent"
1.  Go to **Users** -> **Add user**.
2.  Enter their username (e.g., `jdoe`) and click **Create**.
3.  Go to the **Credentials** tab and click "Set Password" to give them a temporary password.
4.  Go to the **Role Mapping** tab and assign them the `agent` role so they can process tickets.

---

## 5. Potential Issues & Risks
Security is serious business, so keep an eye on these:

### ⚠️ "The Keymaster is Down"
If the Keycloak container crashes, *nobody* can log in. The entire app effectively shuts its doors.
- **Observation**: Check the `tickets_keycloak` container in Docker.

### ⚠️ Token Expiration
Digital ID cards have an "Expiration Date" for security (usually a few minutes or hours).
- **Symptom**: You are suddenly logged out while working.
- **Normal**: This is a security feature, but if it happens every 30 seconds, the "Token Lifespan" needs to be increased in the Realm settings.

### ⚠️ Configuration "Drift"
If you change a role name in Keycloak (e.g., from `agent` to `support-staff`) but don't update the code in the API, the API won't recognize the new ID cards.

---

## 6. Accessing the Passport Office
- **Admin Console**: `http://localhost:8080`
- **Default Credentials**: `admin` / `admin`
- **API Realm URL**: `http://localhost:8080/realms/tickets`

> [!TIP]
> Use the **"Events"** tab in the Keycloak console to see a live feed of who is logging in and if anyone is failing their password checks—this is great for spotting hack attempts!
