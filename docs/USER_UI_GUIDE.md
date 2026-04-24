# 🖥️ User UI: The Infrastructure "Command Center"

This document provides a non-technical and technical overview of the TicketIQ React Frontend.

---

## 1. User UI for Laymen: The "Spaceship Cockpit" Analogy
Imagine you are the captain of a high-tech spaceship. You don't need to know how the engines work or how the oxygen is recycled; you just need to see the dials and buttons in front of you.

- **The Viewport (The Dashboard)**: This is your big window. It shows you the most important stars (High Priority Tickets) and the status of your ship's systems.
- **The Navigation Stick (The Sidebar)**: This allows you to jump between different "Decks" of the ship.
    - **Engineering Deck (Master Control)**: To check the engines.
    - **Intelligence Deck (Automation Hub)**: To see what the AI is thinking.
    - **Cargo Bay (Ticket List)**: To see all the items we are carrying.
- **The Lighting Toggle (Theme Switcher)**: You can switch the cockpit between "Bright Day Mode" (for high energy) and "Stealth Night Mode" (for focus).

**The User UI is your "Digital Steering Wheel." It makes complex AI and database operations feel as simple as clicking a button.**

---

## 2. How it is used in TicketIQ
The UI is the **only part of the system that humans interact with**. It takes the complicated "code" from the API and turns it into beautiful charts, lists, and forms.

### Key Workflows:
1.  **Submitting a Ticket**: You fill out a simple form. Behind the scenes, the UI packages your text and sends it to the "Master Chef" (API).
2.  **Organizing Folders**: You drag and drop tickets into folders. The UI makes this feel smooth, but it's actually updating thousands of records in the database.
3.  **Reviewing AI Decisions**: The UI shows you "Badges" (like 🟢 High Confidence). If the AI is unsure, the UI highlights it in Yellow so you can intervene.

---

## 3. Key Highlights & Features
- **Real-Time Updates**: You don't need to refresh the page to see new tickets. They appear automatically as they are submitted.
- **Responsive Design**: The cockpit shrinks and grows! It works perfectly on your desktop monitor, your laptop, or even your phone.
- **Premium Aesthetics**: We use "Glassmorphism" (glass-like effects) and smooth animations to make the system feel modern and fast.
- **Unified Design System**: Every button and every card looks and feels the same, whether you are in the Admin panel or the User dashboard.

---

## 4. How to Use the "Command Center" (Main Pages)
Here is a quick guide to your most important screens:

| Screen | What to do there | When to use it |
| :--- | :--- | :--- |
| **Dashboard** | View ticket counts and system health. | First thing in the morning. |
| **Ticket List** | Search, filter, and sort all your data. | When looking for a specific issue. |
| **Automation Hub** | See patterns detected by the AI. | To find "Recurring Problems." |
| **Escalation Queue**| Review tickets the AI was unsure about. | When you need to provide "Human Guidance." |

### 💡 Example Task: "Reviewing an AI Suggestion"
1.  Go to the **Escalation Queue**.
2.  Click on a ticket marked with a **"Low Confidence"** badge.
3.  Look at the **Classification Result Panel** on the right.
4.  If the AI's guess is wrong, click the correct category and hit **"Override."** The AI will learn from your choice!

---

## 5. Potential Issues & Risks
Technology isn't perfect:

### ⚠️ "The Spinning Wheel" (Loading Forever)
This usually means the UI is shouting for the API, but the API isn't shouting back.
- **Solution**: Check if you are connected to the internet and if the backend services are running.

### ⚠️ "Stale Content"
Sometimes the UI shows old data because it's trying to be "too fast."
- **Solution**: Click the "Refresh" button or the TicketIQ logo to force a clean update.

---

## 6. Accessing the Command Center
- **Production URL**: `http://localhost:3003` (or port 80 if via Traefik)
- **Development URL**: `http://localhost:3000` (for developers making changes)

> [!TIP]
> Use the **"Search"** bar at the top of the Ticket List to find anything instantly. You can search by ticket ID, user name, or even words inside the description!
