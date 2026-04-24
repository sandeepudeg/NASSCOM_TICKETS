# 🧠 Qdrant Vector DB: The Infrastructure "Library of Meanings"

This document provides a non-technical and technical overview of our Vector Database using Qdrant in the TicketIQ infrastructure.

---

## 1. Qdrant for Laymen: The "Library of Meanings" Analogy
Imagine you are looking for a specific book in a massive library.

- **Traditional Search (Keyword)**: You search for the exact title: "How to fix a broken laptop." If the book is actually titled "Laptop Repair Guide," you won't find it!
- **Vector Search (Semantic)**: You tell the librarian, "I need something about repairing portable computers." The librarian understands the *meaning* of your request and hands you the "Laptop Repair Guide."

**Qdrant is our "Semantic Librarian." It doesn't look for matching words; it looks for matching ideas.**

- **Vectors (The GPS Coordinates for Ideas)**: Qdrant turns every ticket into a set of numbers (GPS coordinates) that represent its meaning. Tickets about "Network issues" will be physically grouped together in Qdrant's digital map.
- **Collections (The Library Sections)**: We keep our tickets in one section and our resolution guides in another.

---

## 2. How it is used in TicketIQ
In our application, Qdrant is the core of our **RAG (Retrieval-Augmented Generation)** system.

### The Retrieval Flow:
1.  **A New Ticket Arrives**: "Internet is slow in the London office."
2.  **Idea Extraction**: Our AI turns this sentence into a "Vector" (a location on the idea map).
3.  **The Search**: Qdrant looks at the map and finds the 5 closest tickets that have already been resolved.
4.  **The Suggestion**: Our system shows you those 5 tickets and says, "Hey, these are basically the same problem! Here is how we fixed them before."

---

## 3. Key Highlights & Features
- **Semantic Understanding**: It finds relevant information even if the user uses different words (e.g., "PC" vs "Computer").
- **Speed**: It can search through millions of tickets in milliseconds to find the most similar ones.
- **Payloads**: Along with the "Meaning," Qdrant stores the actual ticket details (Title, Status, Owner) so we don't have to go back to the main database to see what the ticket says.

---

## 4. How to Use the "Librarian's Desk" (Qdrant Dashboard)
You can inspect our map of ideas using the web interface:

1.  **Access the Dashboard**: Visit `http://localhost:6333/dashboard`.
2.  **Collections**: Click on "Collections" in the left menu to see our sections (e.g., `tickets_vector`).
3.  **Visualize**: You can actually see the "Idea Map" and see how tickets are clustered together.
4.  **Try a Search**: Use the "Filter" or "Search" tool to type a sentence and see which tickets Qdrant thinks are similar.

### 💡 Example Task: "Testing the Librarian"
1.  Open the **Qdrant Dashboard**.
2.  Go to the **`tickets_vector`** collection.
3.  Type "Blue screen of death" in the search box.
4.  Notice how Qdrant returns tickets about "Windows crashing" or "System reboot loop," even if they don't contain the word "Blue."

---

## 5. Potential Issues & Risks
Even a smart librarian can get confused:

### ⚠️ "The Profile is Hidden"
In our setup, Qdrant is part of an optional "Profile."
- **Symptom**: You try to visit `http://localhost:6333` and get a "Connection Refused."
- **Solution**: Run `docker compose --profile vector-store up -d` to start the Qdrant service.

### ⚠️ "The Map is Empty"
If you haven't "indexed" your tickets yet, Qdrant will have no ideas to search through.
- **Solution**: Run the ingestion script (`python scripts/ingest_tickets.py`) to teach Qdrant about your data.

### ⚠️ "Resource Heavy"
Keeping a map of millions of ideas takes a lot of RAM. If Qdrant uses too much memory, it might slow down the entire server.

---

## 6. Accessing the Library
- **Web Dashboard**: `http://localhost:6333/dashboard`
- **API Endpoint**: `http://localhost:6333`
- **Data Location**: `/qdrant/storage` (Saved on your hard drive)

> [!TIP]
> If the "Resolution Suggestions" in the app feel irrelevant, it's often because the "Vector Map" needs to be updated with more high-quality examples.
