# ⚙️ Core API: The Infrastructure "Master Chef"

This document provides a non-technical and technical overview of the TicketIQ Backend API.

---

## 1. Core API for Laymen: The "Master Chef" Analogy
Imagine you are at a world-class restaurant. You don't walk into the kitchen and start frying eggs yourself; you sit at a table and look at a menu.

- **The Menu (API Documentation)**: This is a list of everything the kitchen can do for you (e.g., "Create a Ticket," "Rename a Folder").
- **The Waiter (The API Endpoints)**: When you want something, you tell the waiter. They take your order, bring it to the kitchen, and eventually bring you back your meal (the data).
- **The Master Chef (FastAPI)**: This is the brain of the kitchen. The Chef receives the order, decides which Sous-Chef (Service) should handle it, and ensures the meal is perfect before it's sent out.
- **The Sous-Chefs (Services)**: Specialized workers who handle specific tasks.
    - **The Classifier Chef**: Figures out if your ticket is about "Network" or "Security."
    - **The Database Chef**: Saves your ticket safely in the filing cabinet.

**The Core API is the "Central Nervous System" of TicketIQ. It connects the users to the AI, the database, and the security systems.**

---

## 2. How it is used in TicketIQ
Everything you see on the screen—every ticket, every folder, every AI suggestion—comes from the Core API. It is the bridge between the buttons you click and the data we store.

### The Life of a Request:
1.  **You Click "Submit"**: The Frontend sends a message to the API.
2.  **Security Check**: The API asks Keycloak, "Is this person allowed to be here?"
3.  **Intelligence**: The API asks Ollama, "What is this ticket about?"
4.  **Storage**: The API tells PostgreSQL, "Keep this safe for later."
5.  **Response**: The API sends a "Success" message back to your screen.

---

## 3. Key Highlights & Features
- **Automatic Documentation**: The API writes its own manual! You can see every single "order" you can place by visiting the `/docs` page.
- **High Performance**: Built with "FastAPI," it can handle hundreds of tickets per second without breaking a sweat.
- **Validation**: It acts as a "Bouncer." If you try to submit a ticket without a title, the API catches it and says, "Sorry, you forgot something!" before it even touches the database.

---

## 4. How to Use the "Kitchen Menu" (Swagger UI)
You can test the API directly without using the main website:

1.  **Access the Menu**: Visit `http://localhost:8005/docs`.
2.  **Explore Endpoints**: You'll see sections like `tickets`, `folders`, and `classification`.
3.  **Try it out**:
    - Click on a "GET" button (to read data).
    - Click **"Try it out"** -> **"Execute"**.
    - You will see the raw data the API is sending to the website.

### 💡 Example Task: "Checking System Health"
1.  Go to the **health** section in the API docs.
2.  Click on `/health/ready`.
3.  Click **Execute**.
4.  If it returns `{"status": "ready"}`, you know the API, the Database, and the AI are all talking to each other.

---

## 5. Potential Issues & Risks
Even a Master Chef can have a bad day:

### ⚠️ "500 Internal Server Error"
This is the API's way of saying "Something went wrong in the kitchen and I don't know why."
- **Common Cause**: The Database is full or the AI model is stuck.

### ⚠️ "422 Unprocessable Entity" (The "Wrong Order" Error)
This means you sent data that the API doesn't understand.
- **Example**: You tried to put a 50-page essay in the "Title" field.

---

## 6. Accessing the Kitchen
- **API Base URL**: `http://localhost:8005/api/v1`
- **Interactive Menu**: `http://localhost:8005/docs`
- **Alternative Menu (Redoc)**: `http://localhost:8005/redoc`

> [!TIP]
> If the website is showing "Connection Error," always check the API's `/health/live` page first. If that page doesn't load, the Master Chef has left the building!
